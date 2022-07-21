// 한글 사용 유틸리티 모았습니다.
let Hangul = require('hangul-js');
let ObjectOperation = require('./ObjectOperation');
let HO = require('./HangulObjects');

const Utils = {
    ...HO,

    // 배열/오브젝트 동일성 체크
    objectEqual: ObjectOperation.objectEqual,

    // 배열/오브젝트의 포함관계 체크. a가 b안에 들어갈 때 True
    objectInclude: ObjectOperation.objectInclude,

    //중복 리스트 제거
    removeMultiple: ObjectOperation.removeMultiple,

    // 리스트 더하기
    addList: ObjectOperation.addList,

    // 리스트/함수 합성 등 여러 상황에서 합성할 때 사용함.
    joinMap: ObjectOperation.joinMap,

    // 리스트를 곱하기. 예시  [[1,2,3],[4,5,6]] => [[1,4], [1,5], [1,6], [2,4], [2,5], [2,6], [3,4], [3,5], [3,6]]
    productList: ObjectOperation.productList,

    // 포함관계 정리 - elem이 object 안에 있는지 확인
    objectIn : ObjectOperation.objectIn,

    // 리스트 합집합 구하기. 리스트 원소가 일반이면 그냥 더하기, 오브젝트면 원소들을 union 하기
    listUnion : ObjectOperation.listUnion,

    // 리스트 교집합 구하기
    listIntersection: ObjectOperation.listIntersection,

    escape: (text) => {
        return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    },

    // 메시지에서 특정 패턴을 찾아서 전부 바꿔주는 함수.
    replaceAll: (message, search, replace) => {
        return message.replace(new RegExp(search, 'gi'), replace)
    },

    // 메시지에서 단어의 위치를 찾아주는 함수.
    getPositionAll: (message, search, isString = true) => {
        // 버그 방지를 위해 !, + 기호는 드롭시키자.
        search = search.replace("!","").replace("+","")

        let i = message.indexOf(search),
            indexes = []
        while (i !== -1) {
            // isString이 거짓이면 첫 글자 위치만 추가
            if (!isString) indexes.push(i)

            // isString이 참이면 글자 전체 위치 추가
            else {
                let adding = Array.from(Array(search.length).keys()).map(x => x+i); // [i, i+1, ... i+l-1]
                indexes = indexes.concat(adding);
            }
            i = message.indexOf(search, ++i)
        }
        return indexes;
    },

    // manyArray => [[manyArray[0], manyArray[1]], [manyArray[1], manyArray[2]], ...]
    grabCouple: (manyArray) => {
        return manyArray.slice(0,-1).map((val, num)=> [val, manyArray[num+1]]);
    },

    // 단어를 낱자로 분리하는 함수.
    // 수정 - 매크로 ",", ., !, +관련 처리
    // 한글 낱자가 들어오면 조합하는 방식으로 처리. 즉 낱자 입력 변수 letter를 이용해서 ㄱㅏ -> 가로 처리한다.
    // . 이스케이프 문자.  .. -> .기호, .+ -> +기호 입력
    // 바! -> [바, 뱌, 빠,... ] -유사 문자까지 모두 포함
    // 바+ -> [바, 박, 밖,...]. 받침 또는 중복자음 포함. 고 -> [괴, 괘, 공]
    // wordToarray -> 바?꾸 -> ['바?', '꾸']
    // 20220720 이스케이프 문자 ^, $ 추가.
    wordToArray: word => {
        let wordArray = []; // 결과 출력
        let tmp = ''; // 문자 임시 변수
        let startMacro = false; // 시작매크로 ^감지
        for (let i = 0; i <= word.length - 1; i++) {
            // tmp 입력 문자가 없을 때
            if (tmp === "") {
                // 이스케이프 문자., 한글 낱자, 초성일 때는 입력 대기
                if (/^[.가-힣]$/.test(word[i]) || HO.charInitials.indexOf(word[i])>-1) {
                    tmp = word[i];
                    if (tmp === '.' && startMacro) {
                        startMacro = false; //startMacro가 켜져있을 때 .가 들어오면 강제로 끔.
                    }
                }
                // 맨 처음에 오는 ^ 감지.
                else if (i===0 && word[i]==='^') {
                    startMacro = true; // 시작매크로 감지
                }
                else {
                    wordArray.push(word[i]);
                    startMacro = false; //밀어넣는 순간 startMacro 꺼버리기
                }
            }
            // 이스케이프 문자 . -> 뒤에 아무 문자가 오면 그 문자 입력
            else if (tmp==='.') {
                wordArray.push(word[i]);
                tmp = '';
            }
            // 나머지 경우
            else {
                // wordArray에서 tmp+word[i] 조합시에 한글 낱자가 완성되면 tmp에 추가
                if (/^[가-힣]$/.test(Hangul.assemble(tmp.split('').concat(word[i])))) {
                    tmp =  Hangul.assemble(tmp.split('').concat(word[i]));
                }
                // tmp가 한글 낱자인데 뒤에 ! 혹은 + 조합, 아니면 맨 마지막 글자에 $ 기호 -> 같이 출력
                else if (/^[가-힣]$/.test(Hangul.assemble(tmp.split(''))) && (['!', '+'].indexOf(word[i])>-1 || i===word.length-1 && word[i] === '$')) {
                    wordArray.push(startMacro?"^"+tmp+word[i]:tmp+word[i]);
                    tmp = '';
                    startMacro = false;
                }
                // 한글 문자가 있는데 다른게 들어올 때 -> 한글 출력 후 tmp 변경. 단 ,가 들어오면 삭제
                else if (/^[가-힣]$/.test(Hangul.assemble(tmp.split('')))) {
                    wordArray.push(startMacro?"^"+tmp:tmp);
                    tmp = word[i]===','? '':word[i];
                    startMacro = false;
                }
                // tmp가 비어있지 않은데 ,가 들어옴 -> tmp를 비우고 wordArray에 밀어넣음.
                else if (word[i]===','){
                    wordArray.push(startMacro?"^"+tmp:tmp); tmp = '';
                    startMacro= false;
                }
                else {
                    wordArray.push(tmp); // tmp 밀어넣기
                    tmp = word[i];
                    startMacro = false;
                }
            }

        }
        // 마지막 남은 tmp 출력
        if (tmp!=='') wordArray.push(tmp);
        return wordArray
    },

    // 메시지를 특정 길이로 분리. 옵션 추가 -> full node 이외에 half node 옵션 추가.
    lengthSplit: (message, limit) => {

        let res = [];
        let idx = 1; // 시작점을 반길이부터 잡기
        let firstMsg = message.slice(0, limit);
        let secondMsg = '';
        if (message.length <= limit || limit<1) return [message]; // message 길이가 limit 미달하면 그냥 message 하나 원소 출력
        while (idx*limit/2<message.length) {
            // 짝수번째
            if (idx%2 ==0) {
                firstMsg = message.slice(idx*limit/2, (idx+2)*limit/2);
                res.push(secondMsg);
            }
            // 홀수번째
            else {
                secondMsg = message.slice(idx*limit/2, (idx+2)*limit/2);
                res.push(firstMsg); // firstMsg 추가
            }
            idx++; // idx는 숫자 증가
        }
        // 잔여 메시지 ->
        if (firstMsg.length> secondMsg.length) {
            res.concat([firstMsg, secondMsg]);
        }
        else {
            res.concat([secondMsg, firstMsg]);
        }
        return res.slice(-1)[0]===''? res.slice(0,-1): res;

    },


    // 단어 정렬 기준을 가나다순이 아닌 단어 길이 역순으로 정렬해보자. 긴 단어부터 검사하면 짧은 단어를 중복으로 검사할 이유가 줄어든다.
    sortMap: (inputMap) => {
        let sortedMap = Array.isArray(inputMap)?[]:{}

        if (typeof inputMap === "object" && Array.isArray(inputMap) === true) {
            sortedMap = inputMap.sort((a, b) => (a.length - b.length) ).reverse();
        }
        else if (typeof inputMap === 'object' && Object.keys(inputMap).length>0) {
            Object.keys(inputMap).sort((a,b) => a.length-b.length).reverse().forEach((key) => {
                sortedMap[key] = inputMap[key]
            })
        }
        return sortedMap
    },



    //빠른 연산을 위해 서로소 요건 판별하기
    isDisjoint: (a, b) => {
        if (typeof a === typeof b && typeof a === "object") {
            for (var i in a) {
                // 하나라도 안에 있으면 거짓을 출력.
                if (ObjectOperation.objectIn(a[i], b)) return false;
            }
            return true;
        }
        else {
            return false
        }
    },

    // 리스트에서 특정 타입만 필터링
    filterList: (list, type) => {
        let res = [];
        if (Array.isArray(list)) {
            if (typeof type === "string") {
                res = list.filter(item => (typeof item === type))
            }
            else if (Array.isArray(list)) {
                res = list.filter(item => (Utils.objectIn(typeof item, type)))
            }
        }
        return res;
    },


    // 각 원소를 맵으로 바꿔주는 함수.  여기서 callback은 문자열 단변수를 입력값으로 하는 함수여야 합니다.
    listMap: (elem, callback) => {
        // elem이 문자열, 숫자, 불리안일 때 -> callback(elem) 반환
        if (typeof elem === "string" || typeof elem === "number" || typeof elem === "boolean") {
            return callback(elem);
        }
            // elem이 리스트일 때
        // [1,2,3,...] -> [callback(1),callback(2), callback(3),...]
        else if (typeof elem === "object" && Array.isArray(elem)) {
            let res = elem.map(comp => (Utils.listMap(comp, callback)))
            return res;
        }
            // elem이 오브젝트일 때
        // {k1:v1, k2:v2, ...} -> {k1:callback(v1), k2:callback(v2), ...}
        else if (typeof elem === "object") {
            let res = {}
            for (let key in elem) {
                res[key] = Utils.listMap(elem[key], callback)
            }
            return res;
        }
    },


    // 2차원 배열 형태로 정의된 것을 풀어쓰기. 반복적으로 풀어쓰기 가능
    // [[1,2],[3,4,5]] -> [13,14,15,23,24,25]
    recursiveComponent: (data) => {


        // 배열 정의되지 않은 것은 그대로 출력
        if (typeof data !== "object") return data
        else {
            // 오류 방지를 위해 deep-copy해서 처리하자.
            let newData = JSON.parse(JSON.stringify(data))

            // 데이터의 모든 항 순회
            for (let i=0;i<newData.length;i++){

                // 데이터 원소 내부의 모든 항목을 순회합니다.
                for(let itemIndex in newData[i]){
                    let item = newData[i][itemIndex]

                    // 데이터 항목이 배열인 경우
                    // 재귀 컴포넌트 해석을 진행합니다.
                    if(Array.isArray(item)){
                        let solvedData = Utils.recursiveComponent(item)
                        newData[i][itemIndex] = null
                        newData[i] = newData[i].concat(solvedData)
                    }
                }
            }

            // 그 다음에 null 원소는 모두 제거하기
            for (let i=0; i<newData.length; i++) {
                newData[i] = newData[i].filter(x => x !==null );
            }

            // 데이터 리스트 곱 연산 수행 후 붙여쓰기
            // [[1,2],[3,4,5]] = [[1,3],[1,4],[1,5],[2,3],[2,4],[2,5]]-> [13, 14, 15, 23, 24, 25]
            let presolvedData = ObjectOperation.productList(newData)
            let solvedData = presolvedData.map(x=> x.join(""))

            return solvedData
        }

    },

    // Hangul.disassemble 상위 호환
    // key 조건: part(초중종), key(키보드), sound(음소.복모음, 겹받침 모두 쪼개기)
    disassemble: (msg, cond='key', grouped=false ) => {
        let cont = Hangul.disassemble(msg, true); // 한글 키별로 낱자 분리

        let res = []
        let idx, part;
        for (let letterList of cont) {
            switch(cond) {
                // 키보드 기준. Hangul.disassemble과 동일하게 처리
                case 'key':
                case 'type': {
                    res.push(letterList);
                    break;
                }
                case 'part': {
                    idx = 0;
                    part = letterList;
                    // 복자음 및 복받침 합치기
                    while (idx<part.length) {
                        if (idx<part.length-1 && Utils.objectIn([part[idx], part[idx+1]], Object.values(HO.doubleMap))) {
                            for (var key in HO.doubleMap) {
                                if (ObjectOperation.objectEqual([part[idx], part[idx+1]], HO.doubleMap[key])) {
                                    part.splice(idx, 2, key)
                                    break;
                                }
                            }
                        }
                        idx++;
                    }
                    res.push(part);
                    break;
                }
                case 'sound': {
                    idx = 1; // 초성은 쌍자음도 음단위로 나누지 않으므로 일단 무시
                    part = letterList;
                    // 나누기
                    while (idx < part.length) {
                        if (Object.keys(HO.doubleMap).indexOf(part[idx]) > -1) {
                            let kv = HO.doubleMap[part[idx]];
                            part.splice(idx, 1, kv[0], kv[1]);
                            idx += 2;
                        } else {
                            idx++;
                        }
                    }
                    res.push(part);
                    break;
                }
            }
        }
        // grouped가 참이면 res, 거짓이면 합쳐서 출력
        return grouped? res: ObjectOperation.addList(...res);
    },


    // [var1,var2]가 겹자모 리스트 안에 있는지 판단하기.
    isDouble: (var1, var2, allowSim =false) => {

        let compareList;
        // compareList -> 각 원소의 형태가 "['v1','v2']"
        // allowSim이 리스트 형식일 때...
        if (typeof allowSim === 'object') {
            // allowSim의 원소가 [v1,v2] 형식이면 compareList는 allowSim 그대로, String이면 원소를 [v[0], v[1]] 형식으로 바꿔주기.
            compareList = Array.isArray(allowSim[0])? allowSim : allowSim.map(x=> [x[0], x[1]])
        }
        // 아니면 allowSim이 true/false 때로... true는 유사자음 허용..
        else {
            compareList = allowSim?
                (
                    [
                        ...Utils.doubleConsonant,
                        ...Utils.doubleVowel,
                        ...[
                            ["ㄱ","7"], ["7","7"], ...Utils.productList([["ㄱ", '7'],["ㅅ", "^"]]),
                            ["ㄹ","^"], ["#","ㅅ"], ["ㅂ","^"], ["#","ㅅ"],
                            ["ㅗ","H"], ["ㅜ","y"], ["t","y"], ["T","y"],
                            ...Utils.productList([["ㅗ","ㅜ", "t", "T", "ㅡ", "_"], ["ㅣ", "!", "I", "1","l", "|"]])
                        ].map(x=> [x[0],x[1]])
                    ]
                )
                :[...Utils.doubleConsonant, ...Utils.doubleVowel];
        }
        /// 각 원소에 대해서 포함여부 확인하기.
        return Utils.objectIn([var1, var2], compareList);
    },

    // 겹자모 리스트 -> 겹자모로 바꾸어 출력
    makeDouble(var1, var2) {
        if (Utils.isDouble(var1, var2) || (['ㄱ', 'ㄷ', 'ㅂ', 'ㅅ', 'ㅈ'].indexOf(var1)>-1 && var1 === var2)) {
            for (let key in HO.doubleMap) {
                if (Utils.objectEqual(HO.doubleMap[key], [var1, var2])) {
                    return key;
                }
            }
        }
        else {
            return null
        }
    },

    // 매핑형식 - 키: 어구, {value: 해석된 어구
    // 파싱하기 {씨:{value:시, index:[0]}, 브얼:{value:벌, index:[1]}} ->
    // => {messageList: ['씨', '브얼'], messageIndex: [0,1], parsedMessage: ['시', '벌']}
    // 맵 형식 - qwertyToDubeol map, antispoof map, dropDouble map을 입력으로 한다.
    parseMap: (map, isReassemble = true) => {
        let originalMessageList = []; // 원문의 리스트
        let originalMessageIndex = []; // 메시지의 원무의 위치 표시
        let parsedMessage = []; // 파싱된 메시지 리스트
        let search = 0;
        let maxVal = Object.values(map).map(x=> (Math.max(...x.index))); // index의 값 중에서 최대값.
        let isPartKey = false; // isReassemble 형식일 때

        while(search <= Math.max(...maxVal)) {
            for (let val in map) { // val : 원문의 부분 텍스트값
                // index 값이 존재하면
                if (map[val].index.indexOf(search)!==-1) {
                    originalMessageIndex.push(search); // 인덱스 값 추가
                    originalMessageList.push(val); // 마지막에 집어넣는 메시지 - 현재 메시지
                    parsedMessage.push(map[val].value);

                    if (isReassemble && /[ㄱ-ㅎ]/.test(val[0]) && originalMessageList.length>-1) {
                        let lastVal = originalMessageList.slice(-2)[0]; // originalMessageList의 마지막 글자는 방금 집어넣은 문자라 바로 앞글자로 실험.
                        let joined = lastVal + val[0]; // 마지막 글자에 val[0]을 붙임
                        search = (Hangul.assemble(Hangul.disassemble(lastVal)).length === Hangul.assemble(Hangul.disassemble(joined)).length) ?
                            search + val.length-1: search + val.length; // lastVal과 joined가 한글로 재조합시에 글자가 길어지면 길이에 -1 추가.
                        isPartKey = true;
                    }
                    else search += val.length;
                }
            }
        }
        return {
            messageList: originalMessageList,
            joinedMessage: isPartKey? Hangul.assemble(Hangul.disassemble(originalMessageList.join(''))): originalMessageList.join(''),
            messageIndex: originalMessageIndex,
            parsedMessage: parsedMessage,
            joinedParsedMessage: parsedMessage.join("")
        }
    },

    // reserveMap - parseMap의 역함수. parsed된 내용을 이용해서 맵 복구
    // {messageList: ['씨', '브얼'], messageIndex: [0,1], parsedMessage: ['시', '벌']}
    // =>
    reserveMap: (parsed) => {
        const messageList = parsed.messageList;
        const messageIndex = parsed.messageIndex;
        const parsedMessage= parsed.parsedMessage;
        let res = {}
        for (let i in messageList) {
            if (res[messageList[i]]) {
                res[messageList[i]].index.push(messageIndex[i])
            }
            else {
                res[messageList[i]] = {value: parsedMessage[i], index: [messageIndex[i]]}
            }
        }
        return res;
    },

    // 한글 낱자를 초성중성종성으로 분리하기. cond 옵션 추가
    choJungJong: (char, cond='key') => {

        const consonant = Utils.charInitials;
        const vowel = Utils.charMedials;
        const charDisassemble = Utils.disassemble(char, cond); // 오브젝트가 disassemble 함수에 최적화되어 있어서 일단 수정 보류
        let res = {cho:[], jung:[], jong:[]}
        // 오류 방지를 위해 한글 낱자일 때에만 함수 수행.
        if (/[가-힣]/.test(char)) {
            for (var i =0; i<charDisassemble.length; i++) {
                // 초성 : 처음일 때 들어감.
                if (i===0 && /[ㄱ-ㅎ]/.test(charDisassemble[i])) res.cho.push(charDisassemble[i])
                // 중성 : 모음에 있을 때 들어감.
                else if (/[ㅏ-ㅣ]/.test(charDisassemble[i])) res.jung.push(charDisassemble[i])
                else res.jong.push(charDisassemble[i])
            }
        }
        return res;
    },

    // 메시지를 심플하게 맵으로 바꾸어주는 함수
    // 예시 : 가을 -> {가: {value:가,  index:[0]}, 을: {value:을, index:[1]}}
    msgToMap: (msg) => {
        const msgSplit = msg.split('');
        let res = {}
        for(let ind in msgSplit) {
            if (!res[msgSplit[ind]]) {
                res[msgSplit[ind]] = {value: msgSplit[ind], index: [parseInt(ind)]}
            }
            else {
                res[msgSplit[ind]].index.push(parseInt(ind));
            }
        }
        return res;
    },

    // 한글, 영자 혼합시에 한글 낱자로 분리한 뒤에 조합하기
    // isMap이 false이면 문자열만 출력 -> gksrmf -> 한글
    // isMap이 true이면 맵 형식으로 출력 -> gksrmf -> {gks: {value:한, index:[0]}, rmf: {value:글, index:[3]}}
    qwertyToDubeol: (msg, isMap = false)=> {
        //
        const mapping = Utils.enKoKeyMapping;
        const qwertyToDubeolMacro = (letter) =>  (Object.keys(mapping).indexOf(letter)!==-1 ? mapping[letter] : letter)

        // 맵을 만들 필요 없을 때
        if (!isMap) {
            // 낱자 분리 후에 영어 -> 한글 전환
            let msgReplacedToKo = msg.split('').map((letter) => qwertyToDubeolMacro(letter));
            // 분리된 낱자를 합치기.
            let newMsg = msgReplacedToKo.join('');
            // 결과 - 낱자를 조합하기.
            return Hangul.assemble(newMsg);
        }
        // 맵을 만들어야 할 때
        else {
            let msgSplit = msg.split(""); // 단어 낱자로 분리
            let res = {}; // 한글 치환 가능한 문자셋을 매핑으로 결과 저장
            let temp = ""; // 추가할 글씨에
            // 자음이나 영어 자음에 대응되는 경우
            msgSplit.map( (letter, ind) => {
                let consonant = [...Utils.charInitials, "q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v"]; // 자음
                let vowel = [...Utils.charMedials, "y", "u", "i", "o", "p", "h", "j", "k", "l", "b", "n", "m"]; // 모음

                // 한글로 치환할 수 있는 문자셋 temp를 res에 입력
                let resMacro = (letter, val=temp) => {
                    if (val!=="") {
                        if (!res[val]) res[val] = {value: Utils.qwertyToDubeol(val), index: [ind-val.length]}
                        else { res[val].index.push(ind-val.length);}
                        temp = letter;
                    }
                }
                // 첫 글자는 무조건 추가.
                if (ind ===0) temp +=letter;

                // 자음의 경우 -> 뒤에 모음이 아닌 문자가 올 때만 앞글자에 붙인다.
                else if (consonant.indexOf(letter.toLowerCase()) !==-1 && (ind===msg.length-1 || vowel.indexOf(msgSplit[ind+1].toLowerCase()) ===-1)) {
                    // 앞에 모음이거나
                    if (vowel.indexOf(msgSplit[ind-1].toLowerCase())!==-1 ) {
                        temp +=letter;
                    }
                    // 앞앞이 모음 & 앞자음이 쌍자음 형성할 수 있을 때
                    else if (ind>1 && vowel.indexOf(msgSplit[ind-2].toLowerCase())!==-1 && consonant.indexOf(msgSplit[ind-1].toLowerCase())!==-1) {
                        let mode = [
                            Object.keys(mapping).indexOf(msgSplit[ind-1])!==-1 ? mapping[msgSplit[ind-1]] : msgSplit[ind-1],
                            Object.keys(mapping).indexOf(letter)!==-1 ? mapping[letter] : letter
                        ];
                        // 겹자음 실험 - 겹자음이 안 들어갈 때 매크로 실행.
                        if (!Utils.objectIn(mode, Utils.doubleConsonant)) resMacro(letter);
                        else temp += letter;
                    }
                    else resMacro(letter);
                }

                // 모음의 경우 앞에 자음이 오면 무조건 앞글자에 붙이기
                else if (vowel.indexOf(letter.toLowerCase())!==-1 && consonant.indexOf(msgSplit[ind-1].toLowerCase()) !==-1) {
                    temp +=letter;
                }
                // 복모음 케이스도 고려해보자
                else if (ind>1 && consonant.indexOf(msgSplit[ind-2].toLowerCase())!== -1
                    && vowel.indexOf(msgSplit[ind-1].toLowerCase())!== -1 && vowel.indexOf(letter.toLowerCase())!== -1) {
                    let tempList = [ qwertyToDubeolMacro(msgSplit[ind-1]), qwertyToDubeolMacro(letter)];
                    if (Utils.objectIn(tempList, Utils.doubleVowel)) temp += letter;
                    else resMacro(letter);
                }
                else resMacro(letter);
            });
            // 마지막 글자 붙이기
            if (temp!=="") {
                if (!res[temp]) res[temp]= {value:Utils.qwertyToDubeol(temp), index: [msg.length-temp.length]}
                else {res[temp].index.push(msg.length-temp.length);}
                temp = "";
            }
            return res;
        }

    },

    // 자모조합을 악용한 비속어 걸러내기 ㄱH^H77| 검출 가능. isMap 사용시 오브젝트 형태로 결과물 도출.
    // isMap이 거짓일 때 : ㄱH^H77| -> 개색기
    // isMap이 참일 때: ㄱH^H77ㅣ -> {ㄱH: {value:개, index: [0]}, ^H7: {value: 색, index:[2]}, 7ㅣ: {value:기, index:[5]}}
    antispoof: (msg, isMap = false) => {

        const korConsonant = /[ㄱ-ㅎ]/;
        const korVowel = /[ㅏ-ㅣ]/;
        const korLetter = /[가-힣]/;
        const simConsonant = Object.keys(Utils.similarConsonant); // 자모/자형 오브젝트
        const simVowel = Object.keys(Utils.similarVowel);

        const msgAlphabet = msg.split(""); // 낱자별로 나누어 처리하기
        let msgAlphabetType = []; //타입별로 나누기 - 리스트 사용하지 않고 타입

        // 메시지 알파벳에 유형 추가
        for (var letter of msgAlphabet ) {
            if (["ㄳ", "ㄵ", "ㄶ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅄ"].indexOf(letter)>-1) {msgAlphabetType.push('f')} // 복모음 받침 전용
            else if (korConsonant.test(letter)) { msgAlphabetType.push('c'); } // 자음
            else if (korVowel.test(letter)) { msgAlphabetType.push('v'); } // 모음
            else if (korLetter.test(letter)) { msgAlphabetType.push('h'); } // 한글
            else if (simConsonant.indexOf(letter)!==-1) {msgAlphabetType.push('d');} // 유사자음
            else if (simVowel.indexOf(letter)!==-1) {msgAlphabetType.push('w');} // 유사모음
            else if (letter===' ') {msgAlphabetType.push('s');} // 공백
            else {msgAlphabetType.push('e');} // 나머지 문자
        }

        let preSyllable = []; // 음절단위로 분리하기
        let preSyllableOrigin = []; // isMap 사용시 원본 메시지.
        let preIndex = []; // isMap 사용시 음절의 자릿값 저장하기

        const msgLength = msgAlphabet.length;

        // 인덱스
        let ind = -1;
        // 캐릭터 타입별로 음절 분리하기.
        for (var i =0; i<msgLength; i++) {

            // 음절의 첫 글자를 preSyllable에 추가하는 함수. 원래 낱말 대신 변형해서 입력하고 싶을 때는 msg1로 대신 입력.
            let splitSyllable = (msg1 = msgAlphabet[i]) => {
                preSyllable.push( msg1 );
                if ( isMap ) {
                    preSyllableOrigin.push (msgAlphabet[i]);
                    ind += msgAlphabet[i].length;
                    preIndex.push(ind);
                }
            }

            // 앞음절에 그대로 붙이기
            let joinFrontSyllable = (isSim = false) => {
                let newItem;
                if (isSim) {
                    const simAlphabet = {...Utils.similarConsonant, ...Utils.similarVowel };
                    newItem = simAlphabet[msgAlphabet[i]];
                }
                else newItem = msgAlphabet[i];
                // 치환하기
                preSyllable.splice(-1, 1, preSyllable.slice(-1)[0] + newItem);
                if ( isMap ) {
                    preSyllableOrigin.splice(-1, 1, preSyllableOrigin.slice(-1)[0] + msgAlphabet[i] );
                    ind += msgAlphabet[i].length;

                }
            }

            // 첫자음 잡아내는 함수 작성
            const isFirstDouble = (var1, var2) => {
                let res = false;
                const valFirstDouble = [['7', '7'], ['c', 'c'], ['#', '#'], ['^','^'], ['^', 'n'], ['n', '^'], ['n','n'], ['#', '^'], ['^', '#']]

                for (var dbl of valFirstDouble) {
                    if (Utils.objectEqual([var1, var2], dbl)) res = true;
                }
                return res;
            }

            switch(msgAlphabetType[i]) {

                // 한글이나 공백, 기타문자 -> 그대로 삽입. 한 음절에 하나의 글자만 사용가능하며, 다른 문자 뒤에 붙을 수 없음.
                case 'h':
                case 's':
                case 'e':
                    splitSyllable();
                    break;

                // 자음 -> 모음/유사모음 뒤에 오거나 받침 없는 한글 뒤에 오면서 뒤에 모음/유사모음이 따라오지 않을 때 앞 음절에 붙임.
                // 특수한 겹받침일 때에도 케이스 추가
                case 'c':
                    // 첫자이거나 바로 뒤에 모음이 오면 무조건 음절분리.
                    if (i === 0 || (i<msgLength-1 &&  ['v','w'].indexOf(msgAlphabetType[i+1])>-1)) { splitSyllable();}
                    else {
                        // 자음이 앞글자에 붙는 경우 - 앞에 모음/유사모음, 뒤에 모음/유사모음 없음, ㄸ, ㅃ, ㅉ도 아님.
                        if (
                            ['ㄸ', 'ㅃ', 'ㅉ'].indexOf(msgAlphabet[i]) ===-1 && ['v', 'w'].indexOf(msgAlphabetType[i-1])>-1
                        )
                            joinFrontSyllable();
                        // 앞자음과 합성해서 겹자음을 만드는 케이스 분리하기
                        else if (
                            i>1 && ['v', 'w'].indexOf(msgAlphabetType[i-2])>-1 && Utils.isDouble(msgAlphabet[i-1], msgAlphabet[i])
                        )
                            joinFrontSyllable();

                        // 나머지 경우 - 그냥 뒤 음절에 배치
                        else splitSyllable();
                    }
                    break;

                // 받침 전용 자음의 경우 - 앞에 모음이 있으면 앞 음절에 붙이고 아님 그냥 나누기
                case 'f':
                    if (i>0 && ['v', 'w'].indexOf(msgAlphabetType[i-1])>-1) {joinFrontSyllable()}
                    else splitSyllable();
                    break;

                //모음인 경우
                case 'v':
                    // 첫자일 때는 무조건 삽입.
                    if (i === 0 ) { splitSyllable();}
                    else {
                        // 자음이 앞에 있을 때는 앞에 붙는다.
                        if (msgAlphabetType[i-1] ==='c' || msgAlphabetType[i-1] === 'd') joinFrontSyllable();
                        // 앞의 모음과 함께 복모음 형성할 수 있는 경우 앞에 붙인다.
                        else if (
                            i>1 && (msgAlphabetType[i-2] ==='c' || msgAlphabetType[i-2] === 'd') && Utils.isDouble(msgAlphabet[i-1], msgAlphabet[i])
                        )
                            joinFrontSyllable();
                        // 나머지는 그대로 뒤 움절에 붙이기
                        else splitSyllable();

                    }
                    break;

                //유사 자음인 경우
                case "d":

                    // 처음에는 그냥 삽입. 그러나 모음/유사모음 앞에서만큼은 자음으로 변형되서 들어간다.
                    if (i === 0 ) {
                        splitSyllable(
                            (msgLength>1 && (msgAlphabetType[i+1] ==='v' || msgAlphabetType[i+1] === 'w' || isFirstDouble(msgAlphabet[i], msgAlphabet[i+1]) ))?
                                Utils.similarConsonant[msgAlphabet[i]] : msgAlphabet[i]
                        );
                    }
                    else {
                        // 자음이 앞글자에 붙는 경우 - 앞에 모음/유사모음, 뒤에 모음/유사모음 없음
                        if (
                            (msgAlphabetType[i-1] ==='v' || msgAlphabetType[i-1] === 'w') &&
                            (i < msgLength-1 &&  msgAlphabetType[i+1] !=='v' && msgAlphabetType[i+1] !== 'w'  )
                        )
                            joinFrontSyllable(true);
                        // 앞자음과 합성해서 겹받침을 만드는 케이스 분리하기
                        else if (
                            i>1 && (msgAlphabetType[i-2] ==='v' || msgAlphabetType[i-2] === 'w') &&
                            Utils.isDouble(msgAlphabet[i-1], msgAlphabet[i], true) && (i < msgLength-1 &&  msgAlphabetType[i+1] !=='v' && msgAlphabetType[i+1] !== 'w'  )
                        )
                            joinFrontSyllable(true);
                        // 받침 없는 한글 + 뒤에 모음이 오지 않는 케이스 분리
                        else if (
                            (msgAlphabetType[i-1] === 'h') &&
                            Utils.charMedials.indexOf(Hangul.disassemble(msgAlphabet[i-1]).slice(-1)[0])!==-1  && (i < msgLength-1 &&  msgAlphabetType[i+1] !=='v' && msgAlphabetType[i+1] !== 'w'  )
                        )
                            joinFrontSyllable(true);

                        // 나머지 경우 - 그냥 뒤 음절에 배치
                        else
                            splitSyllable(
                                (msgLength>1 && (msgAlphabetType[i+1] ==='v' || msgAlphabetType[i+1] === 'w' || isFirstDouble(msgAlphabet[i], msgAlphabet[i+1]) ))?
                                    Utils.similarConsonant[msgAlphabet[i]] : msgAlphabet[i]
                            );
                    }
                    break;

                // 유사 모음인 경우
                case 'w':
                    // 첫자일 때는 무조건 삽입. 유사모음은 단어 변형하지 않고 삽입.
                    if (i === 0 ) { splitSyllable();}
                    else {
                        // 자음이 앞에 있을 때는 앞에 붙는다.
                        if (msgAlphabetType[i-1] ==='c' || msgAlphabetType[i-1] === 'd') joinFrontSyllable(true);
                        // 앞의 모음과 함께 복모음 형성할 수 있는 경우 앞에 붙인다.
                        else if (
                            i>1 && (msgAlphabetType[i-2] ==='c' || msgAlphabetType[i-2] === 'd') && Utils.isDouble(msgAlphabet[i-1], msgAlphabet[i], true)
                        )
                            joinFrontSyllable(true);
                        // 나머지는 그대로 뒤 움절에 붙이기
                        else splitSyllable();

                    }
                    break;
            }
        }

        // 결과값
        let res = ""; // 문자열 기록
        let resObj = {}; // isMap이 참일 때는 resObj도 기록

        for (i=0; i<preSyllable.length; i++) {

            res += Hangul.assemble(Hangul.disassemble(preSyllable[i])); // isMap 여부와 무관하게 res 기록
            if (isMap) {
                // 키값이 있으면 인덱스만 추가
                if (Object.keys(resObj).indexOf(preSyllableOrigin[i])!== -1) {
                    resObj[preSyllableOrigin[i]]["index"].push(preIndex[i]);
                }
                else {
                    resObj[preSyllableOrigin[i]] = {value: Hangul.assemble(Hangul.disassemble(preSyllable[i])), index:[preIndex[i]] };
                }
            }
        }

        // 마지막으로 자음/모음 정리하기 ㄱ기 -> 끼, 기ㅏ-> 갸 등
        // 낱자별로 분해
        let resList = Hangul.disassemble(res, true);
        let minSize = Math.min(...resList.map(x=> x.length));
        // 낱자음/낱모음이 있을 때
        let resList2 = [] // 낱자음 낱모음을 붙여서
        let joinKey = {} // 낱자 붙일 키 모음
        let preKey='';
        let postKey='' // 낱자 붙일 키 변수
        let skipElement = false; // 넘길지 테스트
        // 단자음, 단모음이 있을 경우
        if (minSize == 1) {
            // 낱자에 대해서 분석
            for (let ind in resList) {
                // 자음+같은자음+낱자
                if (ind<resList.length-1 && resList[ind].length ===1 && ['ㄱ', 'ㄷ', 'ㅂ', 'ㅅ', 'ㅈ'].indexOf(resList[ind][0]) >-1 && resList[ind][0] == resList[parseInt(ind)+1][0]) {
                    resList2.push([Utils.makeDouble(resList[ind][0], resList[ind][0]), ...resList[parseInt(ind)+1].slice(1)]);
                    skipElement = true;
                    if (isMap) {
                        for (let key in resObj) {
                            // console.log(key, resObj[key].value, resList[ind], resList[parseInt(ind)+1])
                            if (resObj[key].value === Hangul.assemble(resList[ind])) {
                                preKey = key;
                                // console.log(preKey)
                            }
                            else if (resObj[key].value == Hangul.assemble(resList[parseInt(ind)+1])) {
                                postKey = key;
                                // console.log(postKey, 'ENDDDD')
                            }
                        }
                        joinKey[resList2.length-1] = [preKey, postKey];
                    }
                }
                // 뒷자음이 앞음절과 겹자음 받침 형성 가능할 때 또는 뒷모음이 앞음절과 겹모음 형성 가능할 때
                else if (
                    ind<resList.length-1 && resList[parseInt(ind)+1].length ===1 && ObjectOperation.objectIn([resList[ind][resList[ind].length-1], resList[parseInt(ind)+1][0]], Utils.listUnion(HO.doubleConsonant, HO.doubleVowel))
                ) {
                    resList2.push([...resList[ind].slice(0,-1), Utils.makeDouble(resList[ind][resList[ind].length-1], resList[parseInt(ind)+1][0])])
                    skipElement = true;
                    if (isMap) {
                        for (let key in resObj) {
                            if (resObj[key].value === Hangul.assemble(resList[ind])) {
                                preKey = key;
                            }
                            else if (resObj[key].value === Hangul.assemble(resList[parseInt(ind)+1])) {
                                postKey = key;
                            }
                        }
                        joinKey[resList2.length-1] = [preKey, postKey];
                    }
                }
                // 나머지
                else {
                    if (!skipElement) {
                        resList2.push(resList[ind]);
                    }
                    skipElement = false;
                }
            }
            if (!isMap) {
                res = resList2.map(x=> Hangul.assemble(x)).join('')
            }
            else {
                for (let keyNum in joinKey) {
                    // console.log(keyNum, joinKey[keyNum])
                    preKey = joinKey[keyNum][0]
                    postKey = joinKey[keyNum][1]
                    resObj[preKey+postKey] = {value: Hangul.assemble(resList2[keyNum]), index: resObj[preKey].index}
                    delete resObj[preKey]
                    delete resObj[postKey]
                }
            }
        }
        return isMap ? resObj : res;
    },

    // dropDouble함수에서 사용하기 - 기아 -> ['갸'] (리스트 형태로 출력), 밥오 -> true ['바','보'] // false ['바', 'ㅂ오']
    // 반드시 두 낱자가 한글임을 보장해야 사용가능하다.
    // reduced - 음절 사라지지 않게 하느냐 확인. reduced=false는 dropDouble에서 원래음 찾을 때 필요하다.
    // simplify - 음절 단순화 -> 된소리 예사소리로 바꾸고 복잡한 받침 간단하게
    joinedSyllable:(char, nextChar, reduced=true, simplify=false) => {
        // ㅣ+모음 -> 반모음으로 조정하기
        const yVowel = {"ㅏ":"ㅑ", "ㅐ":'ㅒ', 'ㅑ':'ㅑ', 'ㅒ':'ㅒ', 'ㅓ':'ㅕ', 'ㅔ':'ㅖ', 'ㅕ':'ㅕ',
            'ㅖ':'ㅖ', 'ㅗ':'ㅛ', 'ㅛ':'ㅛ', 'ㅜ':'ㅠ', 'ㅠ':'ㅠ', 'ㅡ':'ㅠ', 'ㅣ':'ㅣ' } // 이어 -> 여 단축을 위한 작업

        // 유사모음 축약형으로 잡아내기 위한 조건 갸앙 ->걍
        // 수정 -> 겨여 -> 두번째에 ㅣ가 끼어 있어서 합치지 못한다.
        const vowelLast = {'ㅏ':['ㅏ'], 'ㅐ':['ㅐ', 'ㅔ'], 'ㅑ': ['ㅏ'], 'ㅒ':['ㅐ', 'ㅔ'],
            'ㅓ' : ['ㅓ'], 'ㅔ': ['ㅔ', 'ㅐ'], 'ㅕ': ['ㅓ'], 'ㅖ':['ㅐ', 'ㅔ'],
            'ㅗ':['ㅗ'], 'ㅘ': ['ㅏ'], 'ㅙ': ['ㅐ', 'ㅔ','ㅚ'], 'ㅚ': ['ㅚ'], 'ㅛ':['ㅗ'],
            'ㅜ':['ㅜ', 'ㅡ'], 'ㅝ':['ㅓ'], 'ㅞ': ['ㅔ', 'H'], 'ㅟ': ['ㅟ', 'ㅣ'],
            'ㅠ':['ㅜ', 'ㅡ'], 'ㅡ':['ㅡ'], 'ㅢ': ['ㅢ', 'ㅣ'], 'ㅣ':['ㅣ']}

        // 중복모음 결과 유도. (앞모음+ㅇ+뒷모음 합병 가능여부)
        const doubleVowelResult = (a, b) => {
            // 합칠 수 있을 때 단모음, 합칠 수 없으면 빈 문자열 출력
            // 그아 -> 가, 그이 ->긔
            if (a === 'ㅡ') { return b==='ㅣ'? 'ㅢ': b; }
            // 기아 -> 갸
            else if (a === 'ㅣ' && Object.keys(yVowel).indexOf(b)>-1) { return yVowel[b]; }
            // 갸아 -> 갸, 과아 -> 과
            else if (Object.keys(vowelLast).indexOf(a)>-1 && vowelLast[a].indexOf(b)>-1) { return a; }
            // 고아 -> 과, 두아 -> 돠
            else if (Utils.objectIn([a,b], [['ㅗ','ㅏ'], ['ㅜ','ㅏ'], ['ㅗ', 'ㅘ'], ['ㅜ', 'ㅘ']])){ return 'ㅘ'; }
            else if (Utils.objectIn([a,b], [['ㅗ', 'ㅐ'],[ 'ㅚ','ㅐ'], ['ㅜ', 'ㅐ'], ['ㅗ', 'ㅙ'], ['ㅜ', 'ㅙ'], ['ㅚ', 'ㅙ']])) { return 'ㅙ';}
            else if (Utils.objectIn([a,b], [['ㅗ', 'ㅚ']])) { return 'ㅚ';}
            else if (Utils.objectIn([a,b], [['ㅜ', 'ㅓ'], ['ㅗ', 'ㅓ'], ['ㅜ', 'ㅝ'], ['ㅗ', 'ㅝ']])) { return 'ㅝ'; }
            else if (Utils.objectIn([a,b], [['ㅜ', 'ㅔ'], ['ㅜ', 'ㅞ']])) { return 'ㅞ'; }
            else if (Utils.objectIn([a,b], [['ㅜ', 'ㅣ'], ['ㅜ', 'ㅟ']])) { return 'ㅟ';}
            else { return '';}
        }

        // 낱자 char, nextChar 자모분해
        let curList = Array.isArray(char)? char : Utils.disassemble(char);
        let nextList = Array.isArray(nextChar)? nextChar: Utils.disassemble(nextChar);
        let curCjj = Array.isArray(char)? Utils.choJungJong(Hangul.assemble(char)) : Utils.choJungJong(char);
        let nextCjj = Array.isArray(nextChar)? Utils.choJungJong(Hangul.assemble(nextChar)): Utils.choJungJong(nextChar);

        // Simplify일 때 선제치환
        if (reduced && simplify) {
            // simplify일 때에는 ㅢ -> ㅣ로 선제치환,
            if (curList[1] =='ㅡ' && curList[2] == 'ㅣ') {
                curList.splice(1,1); curCjj.jung = ['ㅣ'];
            }
            if (nextList[1]=='ㅡ' && nextList[2] == 'ㅣ') {
                nextList.splice(1,1); nextCjj.jung = ['ㅣ']
            }
            const simplified = {'ㅑ': 'ㅏ', 'ㅒ': 'ㅐ', "ㅕ": 'ㅓ', 'ㅖ': 'ㅔ', 'ㅛ': 'ㅗ', 'ㅠ': 'ㅜ'};
            // 치음 + 반모음 -> 치음 + 단모음
            if (['ㄷ', 'ㅈ', 'ㅊ', 'ㅉ'].indexOf(curList[0]) >-1) {
                if (Object.keys(simplified).indexOf(curList[1])>-1) {
                    curList.splice(1,1, simplified[curList[1]]);
                    curCjj.jung = [curList[1]]
                }
            }
            if (['ㄷ', 'ㅈ', 'ㅊ', 'ㅉ'].indexOf(nextList[0]) >-1) {
                if (Object.keys(simplified).indexOf(nextList[1])>-1) {
                    nextList.splice(1,1, simplified[nextList[1]]);
                    nextCjj.jung = [nextList[1]]
                }
            }
        }

        let curCho = curList[0];
        let curJung = Hangul.assemble(curCjj.jung);
        let curJongList = curCjj.jong;
        let curJong = Hangul.assemble(curJongList); // 한글자모 합치기

        let nextCho = nextList[0];
        let nextJung = Hangul.assemble(nextCjj.jung);
        let nextJungList = nextCjj.jung;
        let res=[]; // 결과 리스트

        // 경우 나누기 - 우선 앞의 글자의 초성이 ㅇ인 경우
        if (nextCho === 'ㅇ') {
            // ㅇ 아닌 받침이 있는 경우 - 받침 마지막 글자를 다음 글자에 떼어놓자. 복자음일 때는 마지막 글자만 떼어놓는다.
            if (curJongList.length>0 && curJongList[0]!== 'ㅇ') {
                let lastLetter = reduced?[...curList.slice(-1), ...nextList.slice(1)] : [...curList.slice(-1), ...nextList]
                res = [curList.slice(0,-1), lastLetter];
            }
            else if (curJongList[0] === 'ㅇ') {
                res = [curList, nextList ];
            }
            // 받침이 없는 경우
            else {
                // 모음을 합칠 수 있는 경우. not reduced일 때에도 음절은 하나로
                if (doubleVowelResult(curJung, nextJung)!== "") {
                    res = reduced? [[curCho, doubleVowelResult(curJung, nextJung), ...nextList.slice(1+nextJungList.length)]]
                        : [[...curList, ...nextList]];
                }
                // 못 합치면 건드리지 말 것.
                else {
                    res = [curList, nextList];
                }
            }
        }
        // 각호 -> 가코 (거센소리로 바꾸기)
        else if (nextCho === 'ㅎ') {
            // 길이 1이면 받침이 넘어감, 길이 2면 받침은 그대로 다음 자음이 넘어감
            const aspirited = {'ㄱ': 'ㅋ', 'ㄲ': 'ㄲ', 'ㄳ':'ㅋ',  'ㄷ': 'ㅌ',
                'ㅂ': 'ㅍ', 'ㅅ': 'ㅌ', 'ㅆ': 'ㅆ', 'ㅈ': 'ㅌ', 'ㅊ':'ㅌ', 'ㅋ': 'ㅋ', 'ㅌ':'ㅌ', 'ㅍ': 'ㅍ',
                'ㄵ': 'ㄴㅊ','ㄶ': 'ㄴㅎ','ㄺ': 'ㄹㅋ', 'ㄻ': 'ㅁㅎ', 'ㄼ': 'ㄹㅍ','ㄽ': 'ㄹㅆ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅆ'}
            // 단음으로 표시될 때는 aspirited sound를 분리
            if (Object.keys(aspirited).indexOf(curJong)>-1 && aspirited[curJong].length === 1) {
                let lastLetter = reduced? [aspirited[curJong], ...nextList.slice(1)] : [curJong, ...nextList];
                res = [[curCho, curJung], lastLetter];
            }
            // 받침도 발음되면서 앞자음을 바꿀 수 있는 경우는
            else if (Object.keys(aspirited).indexOf(curJong)>-1 && aspirited[curJong].length ===2) {
                let lastLetter = reduced? [aspirited[curJong][1], ...nextList.slice(1)] :
                    [curJongList[1], ...nextList]
                res = (!reduced && ['ㄶ', 'ㄻ', 'ㅀ'].indexOf(curJong)>-1)? [curList, nextList] :
                    [[curCho, curJung, aspirited[curJong][0]], lastLetter]; // ㄶ, ㄻ, ㅀ일 때는 예외로 음절 단위로 나누기
            }
            else {
                res = [curList, nextList];
            }
        }
        // 나머지 -> 받침과 쌍자음이 가능한 경우만 찾아보자
        else {

            // 앞자음+뒷자음 -> 합칠 수 있는 경우
            const consonantJoined = {
                'ㄱㄱ': 'ㄲ',  'ㄱㅋ':'ㅋ',
                'ㄷㄷ': 'ㄸ', 'ㄷㄸ': 'ㄸ','ㄷㅅ': 'ㅆ', 'ㄷㅆ': 'ㅆ', 'ㄷㅈ': 'ㅉ', 'ㄷㅉ':'ㅉ', 'ㄷㅊ': 'ㅊ', 'ㄷㅌ':'ㅌ',
                'ㅂㅂ': 'ㅃ', 'ㅂㅍ': 'ㅍ', 'ㅂㅃ': 'ㅃ',
                'ㅅㄷ': 'ㄸ', 'ㅅㄸ':'ㄸ', 'ㅅㅅ': 'ㅆ', 'ㅅㅈ': 'ㅉ', 'ㅅㅊ': 'ㅊ',
                'ㅈㄷ': 'ㄸ', 'ㅈㅅ': 'ㅆ', 'ㅈㅆ': 'ㅆ', 'ㅈㅈ': 'ㅉ', 'ㅈㅉ': 'ㅉ', 'ㅈㅊ': 'ㅊ',
                'ㅋㄱ': 'ㅋ', 'ㅋㅋ': 'ㅋ', 'ㅌㄷ': 'ㅌ', 'ㅌㅌ': 'ㅌ',
                'ㅍㅂ': 'ㅍ', 'ㅍㅍ': 'ㅍ', 'ㅎㅎ': 'ㅌ',
                'ㄲㄱ':'ㄱㄲ',  'ㅆㅅ': 'ㅅㅆ',
                'ㄷㄴ':'ㄴㄴ', 'ㅅㄴ': 'ㄴㄴ', 'ㅆㄴ': 'ㄴㄴ', 'ㅈㄴ': 'ㄴㄴ', 'ㅊㄴ': 'ㄴㄴ', 'ㅌㄴ': 'ㄴㄴ', 'ㅎㄴ': 'ㄴㄴ'
            }

            // 앞자음+뒷자음  -> 복모음 한정 합치기. 빈 음절은 강제분리 못하게 조치 취하기
            const doubleConsonantJoined = {...consonantJoined,
                "ㄱㄲ": "ㄲ", // ㄺ 관련
                "ㅁㅁ": 'ㅁ', // ㄻ 관련
                "ㅅㄴ": null, 'ㅅㄷ': null, 'ㅅㄸ': null, 'ㅅㅅ': null,  // ㄳ, ㄽ, ㅄ 관련. 음절 분리 못하게 조치.
                "ㅈㄴ": null,  // ㄵ 관련
                "ㅌㄴ": null, //ㄾ 관련
                "ㅎㄱ": "ㅋ", "ㅎㄴ": null, "ㅎㄷ": "ㅌ", "ㅎㅂ": "ㅍ",  "ㅎㅅ": "ㅆ", "ㅎㅈ": "ㅊ", "ㅎㅎ": null  // ㄶ, ㅀ
            }

            let joined = curJongList[curJongList.length-1] + nextCho;
            // 겹반침인 경우
            if (curJongList.length ===2) {
                // 값이 있는 경우 - 재조합
                if (doubleConsonantJoined[joined]) {
                    let lastLetter = reduced? [doubleConsonantJoined[joined], ...nextList.slice(1)]: [curJongList[curJongList.length-1], ...nextList];
                    res = [[curCho, curJung, curJongList[0]], lastLetter];
                }
                // 비어 있는 경우
                else {
                    res = [curList, nextList]; // 분리하지 않는다.
                }
            }
            else if (Object.keys(consonantJoined).indexOf(joined)>-1) {
                // 받침이 완전히 뒷자음에 붙어버리는 경우
                if (consonantJoined[joined].length === 1) {
                    let lastLetter = reduced? [consonantJoined[joined], ...nextList.slice(1)]: [curJongList[curJongList.length-1], ...nextList];
                    res = [[curCho, curJung], lastLetter];
                }
                // 받침음이 살아남는 경우
                else {
                    res = reduced ?[[curCho, curJung, consonantJoined[joined][0]], [consonantJoined[joined][1], ...nextList.slice(1)]]
                        : [curList, nextList]; // reduced가 false면 원래 표기대로 나눈다.
                }
            }
            else {
                res = [curList, nextList];
            }
        }

        // 마지막으로 받침으로 허용되는 음은 ㄱ,ㄴ,ㄷ,ㄹ,ㅁ,ㅂ,ㅅ,ㅇ 여덟개 뿐이기에 다른 음은 단순화
        const simplifyInit = {'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ','ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ'}

        //  복모음 단모음화
        const simplifyMid = {
            'ㅒ':'ㅐ', 'ㅖ':'ㅔ', 'ㅘ': 'ㅏ', 'ㅙ': 'ㅐ', 'ㅝ': 'ㅓ', 'ㅞ': 'ㅔ', 'ㅟ': 'ㅣ', 'ㅢ': 'ㅣ'
        }
        // 치음 한정으로는
        const toothSimplifyMid = {
            ...simplifyMid, 'ㅑ': 'ㅏ', 'ㅕ':'ㅓ', 'ㅛ': 'ㅗ', 'ㅠ': 'ㅜ'
        }
        const simplifyEnd = {
            'ㄲ': 'ㄱ', 'ㄳ': 'ㄱ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ', 'ㄺ': 'ㄱ', 'ㄻ':'ㅁ', 'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㄿ':'ㅂ', 'ㅀ': 'ㄹ',
            'ㅄ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅋ': 'ㄱ', 'ㅌ': 'ㄷ', 'ㅍ': 'ㅂ', 'ㅎ': 'ㄷ'
        }
        // 받침 간단한 쌍자음으로 치환하기. reduced가 있을 때에만 확인인
        if(reduced) {
            // 우선 복자음, 복모음을 하나로 합치기
            for (let idx in res) {
                if (/[ㅏ-ㅣ]/.test(res[idx][2])) res[idx].splice(1,2, Hangul.assemble([res[idx][1], res[idx][2]]))
                if (/[ㄱ-ㅎ]/.test(res[idx][3])) res[idx].splice(2,2, Hangul.assemble([res[idx][2], res[idx][3]]))
            }
            // 단모음/ 단자음화하기
            for (let idx in res) {
                if (simplify && ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'].indexOf(res[idx][0])>-1) {
                    res[idx][0] = simplifyInit[res[idx][0]];
                }
                if (simplify && HO.toothConsonant.indexOf(res[idx][0])>-1 && Object.keys(toothSimplifyMid).indexOf(res[idx][1])>-1) {
                    res[idx][1] = toothSimplifyMid[res[idx][1]]
                }
                else if (simplify && Object.keys(simplifyMid).indexOf(res[idx][1])>-1) {
                    res[idx][1] = simplifyMid[res[idx][1]]
                }
                // 이중받침 단조화는 simplify 컨디션 없이도 처리하자.
                if (res[idx].length ===3 && Object.keys(simplifyEnd).indexOf(res[idx][2])>-1) {
                    res[idx][2] = simplifyEnd[res[idx][2]];
                }
            }
        }

        // 최종작업 - 받침 ㄴ+초성 ㄹ 또는 받침ㄹ+초성ㄴ  -> 받침 ㄹ로 변환
        if (reduced && res.length ===2 && ['ㄹㄴ', 'ㄴㄹ'].indexOf(res[0][2]+res[1][0])>-1 ) {
            res[0][2] = 'ㄹ'; res[1][0] = 'ㄹ'
        }

        // 결과는 자모리스트를 한글로 조합해서 처리한다.
        return res.map(x=> Hangul.assemble(x));

    },

    // ㅇ, ㅡ 제거, 된소리/거센소리 예사음화 후 비속어 찾기. isMap을 사용하면 제거한 모음, 자음 대응 맵 찾기.
    // 예시 : 브압오 -> {'브아':'바', 'ㅂ오':'보'}
    // simplify 옵션을 true로 지정하면 거센소리 된소리를 예사소리화하기, 복모음, 이중모음 단모음화하는 작업도 추가.
    // 메시지는 반드시 한글자모로만 조합.
    dropDouble: (msg, isMap=false, simplify = false) => {

        // let msgAlphabet = Hangul.disassemble(msg, false); // 낱자 단위로 분해
        let msgSplit = msg.split('') // 글자단위로 분해하기

        let divideSyllable = []; // 음절단위 나누기
        let res = {}; // 결과 오브젝트

        // msgAlphabetByLetter 리스트를 첨삭하는 방식으로 재조정
        // msgAlphabetByLetter -> 키값으로 활용할 요소, divideSyllabe -> 출력값으로 활용할 요소
        // 밥으오 -> msgAlphabetByLetter => ['ㅂ','ㅏ'], ['ㅂ','ㅇ','ㅡ','ㅇ','ㅗ'], divideSyllable => ['ㅂ','ㅏ'],['ㅂ','ㅗ']
        // 그다음에 isMap이면 Map으로 만들고 아니면 join한다
        let idx = 0; // 글자 인덱스
        while( idx < msgSplit.length) {
            let letter = msgSplit[idx]; // idx의 첫 글자
            // 첫 글자는 첨삭 대상이 아니므로 다음 글자로 넘어간다.
            if (idx ===0 ) {
                divideSyllable.push(letter); idx++;
            }
            else {
                // 마지막 앞글자와 현재 음절 비교
                let pre = divideSyllable[idx-1]; // 앞글자 리스트
                let lastMsg = msgSplit[idx-1]; // 마지막 메시지
                // 둘 다 한글일 때 - joinedSyllable 활용하기
                if (/^[가-힣]$/.test(letter) && /[가-힣]/.test(pre)) {

                    let lastChar = msgSplit[idx-1][msgSplit[idx-1].length-1]; // msgSplit의 마지막 문자
                    let testRes = Utils.joinedSyllable(pre, letter, true, simplify); // 음절이 줄어들 수 있는 경우

                    let testResXR = Utils.joinedSyllable(lastChar, letter, false); // 음절이 줄어들지 않게 부착하는 경우.
                    // 길이가 1일 때는 글자가 합쳐진 걸로 간주한다.
                    if (testRes.length ===1) {
                        msgSplit.splice(idx-1, 2, msgSplit[idx-1]+letter);
                        divideSyllable[idx-1] = testRes[0];
                    }
                    // 길이가 2일 때는
                    else {
                        msgSplit.splice(idx-1, 2, msgSplit[idx-1].slice(0,-1)+testResXR[0], testResXR[1]);
                        divideSyllable.splice(idx-1, 1, testRes[0], testRes[1]);
                        idx++;
                    }
                }
                // 받침없는 글자 + 낱자음 -> 리스트 합치기
                else if (/^[ㄱ-ㅎ]$/.test(letter)
                    && lastMsg.length === Hangul.assemble(Hangul.disassemble(lastMsg).concat([letter])).length) {
                    msgSplit.splice(idx, 2, Hangul.assemble(Hangul.disassemble(lastMsg).concat([letter])));
                    divideSyllable[divideSyllable.length-1] = Hangul.assemble(Hangul.disassemble(pre).concat([letter]));
                }
                // 나머지 경우 - 그냥 나누어서 넣는다.
                else {
                    divideSyllable.push(letter);
                    idx++;
                }
            }
        }

        // 리스트 도출하는데 성공했으므로 맵을 유도해보자
        if (isMap) {
            let pos = 0; // 위치 벡터
            for (let idx in divideSyllable) {
                let curLetter = msgSplit[idx];
                if (idx == 0) {
                    res[curLetter] = {value: divideSyllable[0], index: [0]}
                    pos += curLetter.length;
                }
                else {
                    let lastLetter = msgSplit[idx-1];
                    if (!res[curLetter]) {
                        res[curLetter] = {value: divideSyllable[idx], index: [pos]}
                    }
                    else {
                        res[curLetter].index.push(pos);
                    }
                    // 앞문자셋과 현재 문자셋을 합친 길이 - 앞 문자셋 길이. 그러면 앞에 자음이 들어갈 때 자음 길이는 뺄 수 있다.
                    pos += Hangul.assemble(Hangul.disassemble(lastLetter).concat(Hangul.disassemble(curLetter))).length - lastLetter.length;
                }
            }
            return res;
        }
        // isMap이 거짓이면 그냥 결과물만 join해서 출력
        else {
            return divideSyllable.join('');
        }

    },


    //ㅄ받침, ㄻ받침, ㄺ받침 과잉으로 사용하는 메시지 검출.
    tooMuchDoubleEnd: (msg, isStrong= false) => {
        const newMsg = msg.split(""); // 우선 모든 코드에서 찾아보자.
        const endPos = newMsg.map(x=> x.charCodeAt()%28); // 받침 코드 확인
        // 받침없음 - 16 -> ㄼ ->27, ㄽ->0, ㅎ->15
        // isStrong 여부에 따라 포괄적인 받침 - ㄳ, ㄵ, ㄶ, ㄺ, ㄻ, ㄼ, ㄽ, ㄾ, ㄿ, ㅀ, ㅄ  전체 잡을것인가 아님 부정적 받침 ㄳ, ㄺ, ㄻ, ㅄ만 잡을 것인가 확인
        const doubleEnd = isStrong? [19, 21, 22, 25, 26, 27, 0, 1, 2, 3, 6]: [19,25, 26, 6]
        let doubleEndPos = []; // 받침 위치
        let seq = 0; // 한글 연속 숫자 확인
        for (let i in endPos) {
            // newMsg가 한글일 때에만 확인해보자
            if (/[가-힣]/.test(newMsg[i])) {
                seq = (doubleEnd.indexOf(Number(endPos[i]))>-1) ? seq +1 : 0; // 연속 숫자
                doubleEndPos.push(seq)
            }
            else {
                doubleEndPos.push(0) // 한글 낱자가 아니면 doubleEndPos에 0을 집어넣는다.
            }
        }
        const cnt = doubleEndPos.filter(x=>x>0).length; // 겹받침 총 갯수
        const contCnt = Math.max(...doubleEndPos); // 겹받침 최대 연속 갯수

        // 연속 3개 이상 또는 겹받침 3개가 있는 경우
        if (contCnt>2 && (newMsg.length/cnt)<=3) {
            let posVal = doubleEndPos.map((x,y)=> [x,y]).filter(x=>x[0]>0).map(x=>x[1]); // 겹받침이 있는 경우의 포지션 정보 추출
            let txtVal = posVal.map(x=> newMsg[x]);
            return {val:true, pos: posVal, txt: txtVal};
        }
        else {
            return {val:false, pos:[], txt:[]};
        }
    },

    // 단문자타입 확인하는 함수
    checkCharType: (char, antispoof=false) => {
        if (/^[가-힣]$/.test(char)) return 'h'; // 한글 낱자
        else if (['ㄸ', 'ㅃ', 'ㅉ'].indexOf(char)>-1) return 'i'; // 초성 전용
        else if (HO.charInitials.indexOf(char)>-1)  return 'c'; // 초성/종성 공용
        else if (/^[ㄱ-ㅎ]$/.test(char)) return 'f'; // 종성전용
        else if (/^[ㅏ-ㅣ]$/.test(char)) return 'v'; // 모음
        else {
            // antispoof 있으면 antispoof 기준으로 캐릭터 분류
            if (antispoof) {
                if (Object.keys(Utils.similarConsonant).indexOf(char)>-1) return 'd'; // 유사자음
                else if (Object.keys(Utils.similarVowel).indexOf(char)>-1) return 'w'; // 유사모음
                else if (/^\s+/.test(char)) return 's';
                else return 'e';
            }
            // antispoof 없으면 발음 기준 적용
            else {
                if (/^[aeiou]+$/.test(char)) return 'ev';
                else if (/^[yw]$/.test(char)) return 'eh';
                else if (/^[bcdfghjklmnpqrstvxz]+$/.test(char)) return 'ec';
                else if (/^\s+/.test(char)) return 's';
                else return 'e';
            }
        }
    },

    // 영어변환 한글로 하기. 최대한 일대일 대응으로만 잡아보자.
    engToKo: (msg, isMap=false) => {
        let msgSplit = msg.toLowerCase().split('');
        let i = 0;
        let korTypeObj = {} // 키 타입 확인
        for (let key in HO.alphabetPronounceMapping) {
            let partObj = HO.alphabetPronounceMapping[key]
            let partRes = []
            for (let key2 in partObj) {
                partRes = partRes.concat(partObj[key2])
            }
            korTypeObj[key] = partRes
        }

        let newMsgSplit = []; // 원소 형식은 [(발음),(조건), (원음)], 조건은 '초', '중', '종', '낱', '기'
        // msgSplit 영어한글 합치기 원칙.
        while (i < msgSplit.length) {
            let letter = msgSplit[i]; // 단어 체크
            // 반모음-> 이중모음 체크
            if (['y', 'w'].indexOf(letter) > -1) {
                let seq = i < msgSplit.length - 1 ? msgSplit[i + 1] : '';
                //
                if (['a', 'e', 'i', 'o', 'u'].indexOf(seq) > -1) {
                    let joined = msgSplit[i] + msgSplit[i + 1];
                    let secondJoined = i < msgSplit.length - 2 ? joined + msgSplit[i + 2] : 'xxx'; // yae 같은 모음 찾기 위해서
                    if (korTypeObj.doubleVowels.indexOf(secondJoined) > -1) {
                        newMsgSplit.push([secondJoined, '중']);
                        i += 3;
                    } else {
                        newMsgSplit.push([joined, '중']);
                        i += 2;
                    }
                } else {
                    if (letter === 'y') {
                        newMsgSplit.push(['y', '중']);
                        i++;
                    } else { // w 다
                        // 음에 모음 아닌 것이 오면 w는 무시한다.
                        i++;
                    }
                }
            }
            // 모음 체크
            else if (['a', 'e', 'i', 'o', 'u'].indexOf(letter) > -1 || /[ㅏ-ㅣ]/.test(letter)) {
                // eui 경우
                if (i < msgSplit.length - 2 && msgSplit.slice(i, i + 3).join("") === 'eui') {
                    newMsgSplit.push(['eui', '중']);
                    i += 3;
                } else {
                    let seq = i < msgSplit.length - 1 ? msgSplit[i + 1] : '';
                    // 알파벳 2개 모음
                    if (korTypeObj.vowels.indexOf(letter + seq) > -1) {
                        newMsgSplit.push([letter + seq, '중']);
                        i += 2;
                    }
                    // 나머지- 단모음.
                    else {
                        newMsgSplit.push([letter, '중']);
                        i++;
                    }
                }
            }
            // 자음 알파벳 또는 자음 낱자 체크 - 받침 확인이 필요함.
            else if (/^[a-z]$/.test(letter) || /[ㄱ-ㅎ]/.test(letter)) {
                // 받침이 올 때는 반드시 모음 뒤에 온다.
                if (newMsgSplit.length > 0 && newMsgSplit[newMsgSplit.length - 1][1] === '중') {
                    let seq = i < msgSplit.length - 1 ? msgSplit[i + 1] : ''; // 뒤의 낱자
                    let nextSeq = i < msgSplit.length - 2 ? msgSplit[i + 2] : ''; // 뒤의 뒤의 낱자
                    // seq가 모음 -> 초성으로 처리
                    if (/[aeiouy]/.test(seq) || (seq === 'w' && /[aeiou]/.test(nextSeq))) {
                        // 중성+x+중성은 ㄱ받침 + ㅅ음가를 차지하기에 특수하게 처리
                        if (letter === 'x') {
                            newMsgSplit.push(['x', '종']);
                            newMsgSplit.push(['x', '초']);
                            i++;
                        } else {
                            newMsgSplit.push([letter, '초']);
                            i++;
                        }
                    }
                    // seq가 자음, nextSeq가 모음 - 예외적인 몇몇 자음 빼고는 letter는 종성, seq는 초성처리
                    else if (/[a-z]/.test(seq) && /[^aeiouyw]/.test(seq) && /[aeiouyw]/.test(nextSeq)) {
                        let joined = letter + seq;
                        if (['ch', 'zh', 'sh', 'th'].indexOf(joined) > -1) {
                            newMsgSplit.push([joined, '초']);
                        } else {
                            newMsgSplit.push([letter, '종']);
                            newMsgSplit.push([seq, '초']);
                        }
                        i += 2;
                    }
                    // 나머지 seq가 자음일 때
                    else if (/[a-z]/.test(seq) && /[^aeiouyw]/.test(seq)) {
                        // letter+seq가 받침자음 형성 가능하면 받침처리
                        if (korTypeObj.endConsonants.indexOf(letter + seq) > -1) {
                            newMsgSplit.push([letter + seq, '종']);
                            i += 2;
                        }
                        // 나머지는 그냥 letter만 받침처리
                        else {
                            if (korTypeObj.endConsonants.indexOf(letter) > -1) {
                                newMsgSplit.push([letter, '종']);
                            }
                            i++; // 받침 여부와 무관하게
                        }
                    }
                    // 나머지 - seq가 자음도 모음도 아님 - 받침일 때에는 처리. 받침 아닐 때에는 무시
                    else {
                        if (korTypeObj.endConsonants.indexOf(letter) > -1) {
                            newMsgSplit.push([letter, '종']);
                        }
                        i++; // 받침 여부와 무관하게
                    }
                }
                // 중성 뒤에 오지 않으면 초성임.
                else {
                    let seq = i < msgSplit.length - 1 ? msgSplit[i + 1] : '';  // 다음 문자
                    if (korTypeObj.consonants.indexOf(letter + seq) > -1) {
                        newMsgSplit.push([letter + seq, '초']);
                        i += 2;
                    } else {
                        newMsgSplit.push([letter, '초']);
                        i++;
                    }
                }
            }
            // 낱자 처리 확인.
            else if (/[가-힣]/.test(letter)) {
                newMsgSplit.push([letter, '낱']);
                i++;
            }
            // 나머지 - 기타
            else {
                newMsgSplit.push([letter, '기']);
                i++;
            }

        }

        // 메시지 조작.
        i = 0;
        while (i<newMsgSplit.length) {
            // 초성 다음에 초성이 오면 중성 ['', '중'] 끼워넣기
            if (i<newMsgSplit.length-1 && newMsgSplit[i][1]==='초' && newMsgSplit[i+1][1]==='초') {
                newMsgSplit.splice(i+1, 0, ['', '중']);
                i+=2;
            }
            // 초성 아닌 것 다음에 중성이 오면 초성 ['', '초'] 끼워넣기
            else if (i<newMsgSplit.length-1 && newMsgSplit[i][1]!=='초' && newMsgSplit[i+1][1] ==='중') {
                newMsgSplit.splice(i+1, 0, ['', '초']);
                i+=2;
            }
            // 초성 b,c,d,g,l,m,n,p,q,r,t,x,z 바로 다음에 한글 낱자가 올 경우 지정된 낱자로 대체
            else if (i<newMsgSplit.length-1 && newMsgSplit[i][1] ==='초' && Object.keys(Utils.singlePronounce).indexOf(newMsgSplit[i][0])>-1 && newMsgSplit[i+1][1]==='낱') {
                newMsgSplit[i] = [Utils.singlePronounce[newMsgSplit[i][0]], '낱', newMsgSplit[i][0]]; // 3번째 리스트에 원본 보존
                i++
            }
            // 특수한 낱자들 다음에 한글 낱자나 기타가 올 경우 낱자로 대체
            else if (i<newMsgSplit.length-1&& newMsgSplit[i][1] === '기' && Object.keys(Utils.singlePronounce).indexOf(newMsgSplit[i][0])>-1 && ['낱', '기'].indexOf(newMsgSplit[i+1][1])>-1 ) {
                newMsgSplit[i] = [Utils.singlePronounce[newMsgSplit[i][0]], '낱', newMsgSplit[i][0]]; // 3번째 리스트에 원본 보존
                i++
            }
            // 나머지는 건드리지 않기
            else {
                i++;
            }
        }

        // 마지막으로 newMsgSplit을 이용해서 결과 메시지 유도하기
        newMsgSplit = newMsgSplit.map((x, idx)=> {
            // 영어 초중종, 혹은 아무것도 없는 것만 바꾸어보자.
            if (/[a-z]/.test(x[0]) || x[0]==='') {
                switch(x[1]) {
                    case '초':
                        let cObj = Utils.alphabetPronounceMapping.consonants;
                        // x[1]이 c일 때는 다음 모음에 따라 발음 결정
                        if (x[1]==='c') {
                            let seq = idx<newMsgSplit.length-1? newMsgSplit[idx+1][0]: '';
                            if (['e', 'i'].indexOf(seq)>-1) {
                                return ['ㅅ', '초', 'c'];
                            }
                            else {
                                return ['ㅋ', '초', 'c'];
                            }
                        }
                        else {
                            for (let key in cObj) {
                                if (cObj[key].indexOf(x[0])>-1) {
                                    return [key, '초', x[0]];
                                }
                            }
                            return x;
                        }
                        break;
                    case '중':
                        let vObj = Utils.alphabetPronounceMapping.vowels;
                        let dObj = Utils.alphabetPronounceMapping.doubleVowels;
                        for (let key in vObj) {
                            if (vObj[key].indexOf(x[0])>-1) {
                                return [key, '중', x[0]];
                            }
                        }
                        for (let key in dObj) {
                            if (dObj[key].indexOf(x[0])>-1) {
                                return [key, '중', x[0]];
                            }
                        }
                        return x;
                        break;
                    case '종':
                        let eObj = Utils.alphabetPronounceMapping.endConsonants;
                        for (let key in eObj) {
                            if (eObj[key].indexOf(x[0])>-1) {
                                return [key, '종', x[0]];
                            }
                        }
                        return x;
                        break;
                    default:
                        return x;
                }
            }
            return x;
        })

        // newMsgSplit을 이용해서 메시지 합성
        if (isMap) {
            let resObj = {}; // 결과 추가
            let j = 0; // 위치 추가
            let key='', val='', valList=[]; // 키, 값, 값 리스트 추가
            for (let k=0; k<newMsgSplit.length; k++) {
                let partList = newMsgSplit[k];
                switch(partList[1]) {
                    // 낱자거낙 기타면 정직하게 글자 추가
                    case '낱':
                    case '기':
                        key = partList.length===3? partList[2]: partList[0];
                        val = partList[0];
                        if (resObj[key]) {
                            resObj[key].index.push(j);
                        }
                        else {
                            resObj[key] = {value: val, index: [j]}
                        }
                        j+=key.length;
                        break;
                    // 초성일 때는 그냥 키값이랑 추가
                    case '초':
                        key = partList.length ===3? partList[2]: partList[0];
                        valList = [partList[0]]; // 우선 리스트로 처리
                        break;
                    // 중성일 때는 다음이 종성이 아닐 때는 추가. 종성일 때는 넘어가자
                    case '중':
                        key = partList.length ===3 ? key+partList[2]: key+partList[0];
                        valList.push(partList[0]);
                        // 종성이 바로 뒤에 안 올 때는 오브젝트 처리
                        if (k === newMsgSplit.length-1 || newMsgSplit[k+1][1] !== '종') {
                            if (resObj[key]) {
                                resObj[key].index.push(j);
                            }
                            else {
                                resObj[key] = {value: Hangul.assemble(valList), index: [j]}
                            }
                            j +=key.length;
                        }
                        break;
                    // 종성일 때는 바로 조립
                    case '종':
                        key = partList.length ===3 ? key+partList[2]: key+partList[0];
                        valList.push(partList[0]);
                        if (resObj[key]) {
                            resObj[key].index.push(j);
                        }
                        else {
                            resObj[key] = {value: Hangul.assemble(valList), index: [j]}
                        }
                        j +=key.length;
                        break;
                }
            }
            return resObj;

        }
        else {
            return Hangul.assemble(newMsgSplit.map(x=>x[0])); // newMsgSplit의 자, 모, 낱자만 모은 뒤 assemble 함수로 메시지 조합.
        }

    },

    // position vector에서 map의 original position을 찾아보기
    originalPosition: (map, positionList=[]) => {
        const parsed = Utils.parseMap(map);
        const originalLength = parsed.joinedMessage.length;
        const parsedLength = parsed.joinedParsedMessage.length;
        positionList = positionList.filter(x=> x<parsedLength); // parsedLenght보다 짧게 잡아서 에러 방지.
        const originalPosition = parsed.messageIndex.concat([originalLength]); // 인덱스에 마지막 리스트 넣기
        const originalRange = Utils.grabCouple(originalPosition); // 범위 형태로 출력
        let res = []
        for (let idx in originalRange) {
            // positionList 안에 있는 원소들만 찾아보자
            let lix = originalRange[idx];
            if (ObjectOperation.objectIn(Number(idx), positionList)) {
                res = res.concat(Array.from(Array(lix[1]-lix[0]).keys()).map(x => x+lix[0]));
            }
        }
        return res;
    }

}

module.exports = Utils;
