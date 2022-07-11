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

    escape: (text) => {
        return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    },

    // 메시지에서 특정 패턴을 찾아서 전부 바꿔주는 함수.
    replaceAll: (message, search, replace) => {
        return message.replace(new RegExp(search, 'gi'), replace)
    },

    // 메시지에서 단어의 위치를 찾아주는 함수.
    getPositionAll: (message, search, isString = true) => {
        // 버그 방지를 위해 !, ? 기호는 드롭시키자.
        search = search.replace("!","").replace("?","")

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

    // 단어 -> 낱자로 분리하는 함수. 매크로를 이용한 처리
    // 수정 - 매크로 ., !, +, ?
    // . 이스케이프 문자. .? -> ?기호 사용, .. -> .기호, .+ -> +기호 입력
    // 바! -> [바, 뱌, 빠,... ].
    // 바? -> 한글 ? 개수까지 완전 무시...
    // 바+ -> [바, 박, 밖,...]. 받침 포함.
    // wordToarray -
    wordToArray: word => {
        let wordArray = []
        for (let i = 0; i <= word.length - 1; i++) {

            if ((i===1 || i>1 && word[i-2]!== "." )&& word[i-1] === ".") {
                wordArray.splice(-1, 1, word[i])
            }
            // .뒤에 오지 않는 경우 ? 기호는 뒷 문자에 붙여서 밀어넣기
            else if (word[i] === "?") {
                wordArray.splice(-1, 1, wordArray.slice(-1)[0]+word[i])
            }
            // !, + 기호 관련. 한글 뒤에 오는 경우 앞 문자에 붙이기.
            else if (i>0 && /[가-힣]/.test(word[i-1]) && (word[i] === "!" || word[i] === "+") ) {
                wordArray.splice(-1, 1, wordArray.slice(-1)[0]+word[i])
            }
            // 그 외의 경우는 따로 놓기.
            else {
                wordArray.push(word[i])
            }
        }
        return wordArray
    },

    // 메시지를 특정 길이로 분리. 옵션 추가 -> full node 이외에 half node 옵션 추가.
    lengthSplit: (message, limit) => {
        if (message.length <= limit) return [message]

        let fixedMessage = []
        let fullMessageLength = message.length
        let currentLength = 0
        const halfLimit = Math.floor(limit/2)

        let splitList = []
        let splitList2 = []
        while (currentLength.length>=0) {
            if (currentLength == fullMessageLength) {
                if (currentLength != 0) {
                    if (splitList.length > splitList2.length) {
                        fixedMessage.push(splitList.join(''))
                        if (splitList2.length>0 ) fixedMessage.push(splitList2.join(""))
                        splitList = []
                        splitList2 = []
                    }
                    else {
                        fixedMessage.push(splitList2.join(""))
                        if ( splitList.length>0 ) fixedMessage.push(splitList.join(""))
                        splitList =[]
                        splitList2 =[]
                    }
                }
                break
            }
            if (currentLength != 0 && currentLength % limit == 0 && splitList.length != 0) {
                fixedMessage.push(splitList.join(''))
                splitList = []
            }
            if (currentLength !==0 && currentLength % limit == halfLimit && splitList2.length !==0) {
                fixedMessage.push(splitList2.join(""))
                splitList2 = []
            }
            splitList.push(message[currentLength])
            if (currentLength >= halfLimit) {
                splitList2.push(message[currentLength])
            }
            currentLength++
        }

        return fixedMessage
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
        if (typeof elem === "string" || typeof elem === "number" || typeof elem === "boolean") {
            return callback(elem);
        }
        // elem이 리스트일 때
        else if (typeof elem === "object" && Array.isArray(elem)) {
            let res = elem.map(comp => (Utils.listMap(comp, callback)))
            return res;
        }
        else if (typeof elem === "object") {
            let res = {}
            for (let key in elem) {
                res[key] = Utils.listMap(elem[key], callback)
            }
            return res;
        }
    },


    // 2차원 배열 형태로 정의된 것을 풀어쓰기.
    recursiveComponent: (data) => {

        // 배열 정의되지 않은 것은 그대로 출력
        if (typeof data !== "object") return data
        else {
            // 데이터의 모든 항 순회
            for (let i=0;i<data.length;i++){

                // 데이터 원소 내부의 모든 항목을 순회합니다.
                for(let itemIndex in data[i]){
                    let item = data[i][itemIndex]

                    // 데이터 항목이 배열인 경우
                    // 재귀 컴포넌트 해석을 진행합니다.
                    if(Array.isArray(item)){
                        let solvedData = Utils.recursiveComponent(item)
                        data[i][itemIndex] = null
                        data[i] = data[i].concat(solvedData)
                    }
                }
            }

            // 그 다음에 null 원소는 모두 제거하기
            for (let i=0; i<data.length; i++) {
                data[i] = data[i].filter(x => x !==null );
            }

            // 데이터 리스트 곱 연산 수행.
            // [[1,2],[3,4,5]] = [[1,3],[1,4],[1,5],[2,3],[2,4],[2,5]]
            let presolvedData = ObjectOperation.productList(data)
            let solvedData = presolvedData.map(x=> x.join(""))

            return solvedData
        }

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

    // 파싱하기 {씨:{value:시, index:[0]}, 브얼:{value:벌, index:[1]}}
    // 매핑형식 - 키: 어구, {value: 해석된 어구
    // => {messageList: 씨브얼, messageIndex: [0,1], parsedMessage: ['시', '벌']}
    // 맵 형식 - qwertyToDubeol map, antispoof map, dropDouble map을 입력으로 한다.
    parseMap: (map) => {
        let originalMessageList = [];
        let originalMessageIndex = [];
        let parsedMessage = [];
        let search = 0;
        let maxVal = Object.values(map).map(x=> (Math.max(...x.index)));

        while(search <= Math.max(...maxVal)) {
            for (let val in map) {
                // index 값이 존재하면

                if (map[val].index.indexOf(search)!==-1) {
                    originalMessageIndex.push(search);
                    originalMessageList.push(val);
                    parsedMessage.push(map[val].value);

                    if (/^[ㄱ-ㅎ][가-힣]+$/.test(val)) search +=val.length-1;
                    else search += val.length;
                }
            }
        }
        return {
            messageList: originalMessageList,
            messageIndex: originalMessageIndex,
            parsedMessage: parsedMessage
        }
    },

    // 한글 낱자를 초성중성종성으로 분리하기
    choJungJong: (char) => {
        const consonant = Utils.charInitials;
        const vowel = Utils.charMedials;
        const charDisassemble = Hangul.disassemble(char);
        let res = {cho:[], jung:[], jong:[]}
        // 오류 방지를 위해 한글 낱자일 때에만 함수 수행.
        if (/[가-힣]/.test(char)) {
            for (var i =0; i<charDisassemble.length; i++) {
                // 초성 : 처음일 때 들어감.
                if (i===0 && consonant.indexOf(charDisassemble[i])>-1) res.cho.push(charDisassemble[i])
                // 중성 : 모음에 있을 때 들어감.
                else if (vowel.indexOf(charDisassemble[i])>-1) res.jung.push(charDisassemble[i])
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
            let msgRes = []; // 결과
            let res = {}; // 결과 맵핑
            let temp = ""; // 추가할 글씨에
            // 자음이나 영어 자음에 대응되는 경우
            msgSplit.map( (letter, ind) => {
                let consonant = [...Utils.charInitials, "q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v"];
                let vowel = [...Utils.charMedials, "y", "u", "i", "o", "p", "h", "j", "k", "l", "b", "n", "m"];

                //
                let resMacro = (letter, val=temp) => {
                    if (val!=="") {
                        msgRes.push(val);
                        if (!res[val]) res[val] = {value: Utils.qwertyToDubeol(val), index: [ind-val.length]}
                        else { res[val].index.push(ind-val.length);}
                        temp = letter;
                    }
                }
                // 첫 글자는 무조건 추가.
                if (ind ===0) {
                    temp +=letter;
                }
                // 자음의 경우 -> 뒤에 모음이 아닌 문자가 올 때만 앞글자에 붙인다.
                else if (consonant.indexOf(letter.toLowerCase()) !==-1 && (ind===msg.length-1 || vowel.indexOf(msgSplit[ind+1].toLowerCase()) ===-1)) {
                    // 앞에 모음이거나
                    if (vowel.indexOf(msgSplit[ind-1].toLowerCase())!==-1 ) {
                        temp +=letter;
                    }
                    // 앞앞이 모음& 앞자음이 쌍자음 형성할 수 있을 때
                    else if (ind>1 && vowel.indexOf(msgSplit[ind-2].toLowerCase())!==-1 && consonant.indexOf(msgSplit[ind-1].toLowerCase())!==-1) {
                        let mode = [
                            Object.keys(mapping).indexOf(msgSplit[ind-1])!==-1 ? mapping[msgSplit[ind-1]] : msgSplit[ind-1],
                            Object.keys(mapping).indexOf(letter)!==-1 ? mapping[letter] : letter
                        ];
                        // 겹자음 실험

                        if (Utils.objectIn(mode, Utils.doubleConsonant)) resMacro(letter);
                        else temp += letter;
                    }
                    else resMacro(letter);
                }
                // 모음의 경우 앞에 자음이 오면 무조건 앞글자에 붙이기
                else if (vowel.indexOf(letter.toLowerCase())!==-1 && consonant.indexOf(msgSplit[ind-1].toLowerCase()) !==-1) {
                    temp +=letter;
                }
                // 목모음 케이스도 고려해보자
                else if (ind>1 && consonant.indexOf(msgSplit[ind-2].toLowerCase())!== -1  && vowel.indexOf(msgSplit[ind-1].toLowerCase())!== -1 && vowel.indexOf(letter.toLowerCase())!== -1) {
                    let tempList = [ qwertyToDubeolMacro(msgSplit[ind-1]), qwertyToDubeolMacro(letter)];
                    if (Utils.objectIn(tempList, Utils.doubleVowel)) {
                        temp += letter;
                    }
                    else {
                        resMacro(letter);
                    }
                }
                else resMacro(letter);
            });
            // 마지막 글자 붙이기
            if (temp!=="") {
                msgRes.push(temp);
                if (!res[temp]) res[temp]= {value:Utils.qwertyToDubeol(temp), index: [msg.length-temp.length]}
                else {res[temp].index.push(msg.length-temp.length);}
                temp = "";
            }
            return res;

        }

    },

    //자모조합을 악용한 비속어 걸러내기 ㄱH^H77| 검출 가능. isMap 사용시 오브젝트 형태로 결과물 도출.
    // isMap이 거짓일 때 : ㄱH^H77| -> 개색기
    // isMap이 참일 때: ㄱH^H77ㅣ -> {ㄱH: {value:개, index: [0]}, ^H7: {value: 색, index:[2]}, 7ㅣ: {value:기, index:[5]}}
    antispoof: (msg, isMap = false) => {

        const korConsonant = /[ㄱ-ㅎ]/;
        const korVowel = /[ㅏ-ㅣ]/;
        const korLetter = /[가-힣]/;
        // const singleParts = Object.keys(Utils.singlePronounce);
        const simConsonant = Object.keys(Utils.similarConsonant);
        const simVowel = Object.keys(Utils.similarVowel);

        const msgAlphabet = msg.split(""); // 낱자별로 나누어 처리하기
        let msgAlphabetType = []; //타입별로 나누기

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

        // console.log('음절단위분리', preSyllable);
        // if (isMap) console.log('음절단위 분리 원래 메시지', preSyllableOrigin);

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
                            console.log(key, resObj[key].value, resList[ind], resList[parseInt(ind)+1])
                            if (resObj[key].value === Hangul.assemble(resList[ind])) {
                                preKey = key;
                                console.log(preKey)
                            }
                            else if (resObj[key].value == Hangul.assemble(resList[parseInt(ind)+1])) {
                                postKey = key;
                                console.log(postKey, 'ENDDDD')
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
                // console.log(resList2)
                res = resList2.map(x=> Hangul.assemble(x)).join('')
                // console.log(res)
            }
            else {
                for (let keyNum in joinKey) {
                    console.log(keyNum, joinKey[keyNum])
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

    // ㅇ, ㅡ 제거, 된소리/거센소리 예사음화 후 비속어 찾기. isMap을 사용하면 제거한 모음, 자음 대응 맵 찾기.
    // 예시 : 브압오 -> {'브아':'바', 'ㅂ오':'보'}
    // simplify 옵션을 true로 지정하면 거센소리 된소리를 예사소리화하기, 복모음, 이중모음 단모음화하는 작업도 추가.
    // 메시지는 반드시 한글자모로만 조합.
    dropDouble: (msg, isMap=false, simplify = false) => {

        let msgAlphabet = Hangul.disassemble(msg, false);
        const varAlphabet = {"ㄲ":'ㄱ', 'ㄸ':'ㄷ', 'ㅃ':'ㅂ','ㅆ':'ㅅ', 'ㅉ':'ㅈ', 'ㅋ':'ㄱ', 'ㅌ':'ㄷ', 'ㅍ':'ㅂ',
            'ㅒ':'ㅐ','ㅖ':'ㅔ'}; // 된소리 단순화
        const aspiritedSound = {"ㄱ": "ㅋ", "ㄷ":"ㅌ", "ㅂ":"ㅍ", "ㅅ":"ㅌ", "ㅈ":"ㅌ", "ㅊ":"ㅌ", "ㅋ":"ㅋ", "ㅌ":"ㅌ","ㅍ":"ㅍ", "ㅎ":"ㅎ"} // ㅎ앞 거센소리 연음화
        const yVowel = {"ㅏ":"ㅑ", "ㅐ":'ㅒ', 'ㅑ':'ㅑ', 'ㅒ':'ㅒ', 'ㅓ':'ㅕ', 'ㅔ':'ㅖ', 'ㅕ':'ㅕ', 'ㅖ':'ㅖ', 'ㅗ':'ㅛ', 'ㅛ':'ㅛ', 'ㅜ':'ㅠ', 'ㅠ':'ㅠ', 'ㅡ':'ㅠ', 'ㅣ':'ㅣ' }
        // 유사모음 축약형으로 잡아내기 위한 조건 갸앙 ->걍
        const vowelLast = {'ㅏ':['ㅏ'], 'ㅐ':['ㅐ', 'ㅔ'], 'ㅑ': ['ㅏ', 'ㅑ'], 'ㅒ':['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ'], 'ㅓ' : ['ㅓ'], 'ㅔ': ['ㅔ', 'ㅐ'], 'ㅕ': ['ㅓ', 'ㅕ'], 'ㅖ':['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ'],
            'ㅗ':['ㅗ'], 'ㅛ':['ㅛ', 'ㅗ'], 'ㅜ':['ㅜ', 'ㅡ'], 'ㅠ':['ㅠ', 'ㅜ', 'ㅡ'], 'ㅡ':['ㅡ'], 'ㅣ':['ㅣ']}
        // 유사모음 축약형. 그러나 이 경우는 뒷모음을 따를 때 -> 구아 -> 과, 구에 -> 궤 고언세 -> 권세
        const vowelPair = [['ㅗ', 'ㅏ'], ['ㅗ', 'ㅐ'], ['ㅗ', 'ㅓ'], ['ㅗ', 'ㅔ'], ['ㅜ', 'ㅏ'], ['ㅜ', 'ㅐ'], ['ㅜ', 'ㅓ'], ['ㅜ', 'ㅔ'], ['ㅜ', 'ㅣ'], ['ㅡ', 'ㅣ']]
        // map일 때 최종결과용
        let singleSyllable = []; // 음절 단위
        let divideSyllable = []; // 음절단위 나누기
        let res = {};

        // 상쇄모음 조합 -

        if (!isMap) {
            var i=0;

            // 문제 해결을 위해 단모음화하는 과정은 자음 축약화 프로세스 다음으로 미루자.
            while ( i <msgAlphabet.length) {
                if (1<i<msgAlphabet.length-1 && msgAlphabet[i] === 'ㅇ') {
                    // 자음+모음+ㅇ+모음
                    if (Utils.charInitials.indexOf(msgAlphabet[i-2])!== -1 && Utils.charMedials.indexOf(msgAlphabet[i-1])!== -1 && Utils.charMedials.indexOf(msgAlphabet[i+1])!== -1
                    ) {
                        // 자음+ㅡ+ㅇ+모음,
                        if (msgAlphabet[i-1] === 'ㅡ') {
                            /// ㅢ는 예외처리.
                            if ( msgAlphabet[i] === "ㅣ") {msgAlphabet.splice(i-1, 1); i++;}
                            else  { msgAlphabet.splice(i-1, 2); }
                        }
                        // 자음+ㅣ+ㅇ+모음. 이중모음이 뒤에 올 때는 예외처리.
                        else if (msgAlphabet[i-1] === 'ㅣ' && Object.keys(yVowel).indexOf(msgAlphabet[i+1])!==-1 && Utils.charMedials.indexOf(msgAlphabet[i+2])===-1 ) {
                            msgAlphabet.splice(i-1, 3, yVowel[msgAlphabet[i+1]]);
                        }
                        // 자음+모음+ㅇ+중복모음
                        else if( Object.keys(vowelLast).indexOf(msgAlphabet[i-1])!== -1 && vowelLast[msgAlphabet[i-1]].indexOf(msgAlphabet[i+1])!==-1 ) {
                            msgAlphabet.splice(i, 2);
                        }
                        // 자음+모음+ㅇ+모음, 복모음 형성 가능한 조합
                        else if (Utils.isDouble(msgAlphabet[i-1], msgAlphabet[i+1], vowelPair) ) {
                            // 일부 복모음과 일치하지 않는 부분은 복모음 조합에 맞게 변형하기
                            if (msgAlphabet[i-1] === 'ㅗ' && msgAlphabet[i+1] === 'ㅓ') msgAlphabet[i-1] = 'ㅜ';
                            else if (msgAlphabet[i-1] === 'ㅗ' && msgAlphabet[i+1] === 'ㅔ') msgAlphabet[i+1] = 'ㅣ';
                            else if (msgAlphabet[i-1] === 'ㅜ' && msgAlphabet[i+1] === 'ㅏ') msgAlphabet[i-1] = 'ㅗ';
                            else if (msgAlphabet[i-1] === 'ㅜ' && msgAlphabet[i+1] === 'ㅐ') msgAlphabet[i-1] = 'ㅔ';

                            msgAlphabet.splice(i, 1);
                        }

                        else i++; // 다음으로 넘기기

                    }
                    // 자음+복모음+ㅇ+뒤모음과 동일함. -> ㅚ+이는 제외.
                    else if (i>2 && Utils.charInitials.indexOf(msgAlphabet[i-3])!== -1 && Utils.charMedials.indexOf(msgAlphabet[i-1])!== -1 &&
                        (Utils.isDouble(msgAlphabet[i-2], msgAlphabet[i-1]) === true && !(msgAlphabet[i-2]==='ㅗ' && msgAlphabet[i-1]==='ㅣ') ) && msgAlphabet[i-1] == msgAlphabet[i+1]
                    ) {
                        msgAlphabet.splice(i,2);
                    }
                    // 자음+ㅇ+모음 -> ㅇ만 지우기. 복자음일 때도 해결 가능. 단 ㅇ일 때는 예외로
                    else if (Utils.charInitials.indexOf(msgAlphabet[i-1])!== -1 && msgAlphabet[i-1] !=='ㅇ' && Utils.charMedials.indexOf(msgAlphabet[i+1])!== -1
                    ) msgAlphabet.splice(i, 1);

                    else i++; // 다음으로 넘기기
                }
                // 다른 자음일 때는
                else if (1<i<msgAlphabet.length-1 && Utils.charInitials.indexOf(msgAlphabet[i]) !== -1) {
                    // 앞의 받침이 뒤의 자음과 "사실상 중복일 때" 앞 자음 제거. 그 앞에 모음 오는지, 자음 오는지는 상관 없음.
                    if (Utils.charInitials.indexOf(msgAlphabet[i-1])!== -1 && (Utils.objectIn(msgAlphabet[i-1], Utils.jointConsonant[msgAlphabet[i]]))
                        && Utils.charMedials.indexOf(msgAlphabet[i+1])!== -1
                    ) msgAlphabet.splice(i-1, 1);

                    // ㅎ과 결합했을 때 거센소리화. 색히 -> 새키
                    else if ( msgAlphabet[i] === 'ㅎ' && Object.keys(aspiritedSound).indexOf(msgAlphabet[i-1])!==-1) {
                        msgAlphabet[i-1] = aspiritedSound[msgAlphabet[i-1]];
                        msgAlphabet.splice(i, 1);
                    }

                    i++; // 다음으로 넘겨주기
                }

                else {
                    // 첫자이지만 자음 뒤에 ㅇ 아닌 자음+모음이 오는 경우 제거.
                    if (i===0 && Utils.charInitials.indexOf(msgAlphabet[0])!== -1 && Utils.charInitials.indexOf(msgAlphabet[1])!== -1 && msgAlphabet[1]!=="ㅇ" && Utils.charMedials.indexOf(msgAlphabet[2])!==-1 ) {
                        msgAlphabet.shift();
                    }
                        // 모음 뒤에 모음이 바로 오는 경우 맨 앞글자를 제거한다.
                        // else if (i===0 && Utils.charMedials.indexOf(msgAlphabet[0])!== -1 && Utils.charMedials.indexOf(msgAlphabet[1])!== -1) {
                        //     msgAlphabet.shift();
                    // }
                    else i++;
                }
            }
            // 단음화 작업 - 뒤로 미루기
            if (simplify) {
                i = 0;
                while (i< msgAlphabet.length) {
                    if (Object.keys(varAlphabet).indexOf(msgAlphabet[i])!== -1) {
                        msgAlphabet[i] = varAlphabet[msgAlphabet[i]];
                        i++;
                    }
                    // 모음일 때는 앞의 모음과 복모음을 형성하지 못하는 경우 모음들만 제거하기  - 일단 dropDouble은 완전한 한글에서만 실험할 것.
                    else if (Utils.charMedials.indexOf(msgAlphabet[i])!== -1) {

                        // 겹모음 단모음화하기
                        if ( Object.keys(varAlphabet).indexOf(msgAlphabet[i])!== -1) {
                            msgAlphabet[i] = varAlphabet[msgAlphabet[i]];
                            i++;
                        }
                        // 복모음 단모음화하기
                        else if ( ObjectOperation.objectIn([msgAlphabet[i-1], msgAlphabet[i]],Utils.doubleVowel )) {
                            if (msgAlphabet[i-1] !== "ㅗ" || msgAlphabet[i] !=="ㅣ") {
                                msgAlphabet.splice(i-1, 1);
                                i++;
                            }
                            else {
                                i++;
                            }

                        }
                            //     if ( !Utils.isDouble(msgAlphabet[i-1], msgAlphabet[i]) ) {
                            //         msgAlphabet.splice(i,1);
                        //     }
                        else i++;
                    }
                    else i++;
                }
            }

            // console.log("RESULT_", msgAlphabet)
            return Hangul.assemble(msgAlphabet);

        }
        // isMap으로 정의할 경우 음절 단위로 우선 쪼갠 뒤 dropDouble 수행
        else {
            i =0;
            while ( i < msgAlphabet.length ) {

                // 처음일 때는
                if (i === 0 ) {
                    singleSyllable.push(msgAlphabet[i]);
                    i++;
                }
                // 나머지 경우
                else {
                    // 자음 ㅇ
                    if (msgAlphabet[i] === 'ㅇ') {

                        // 모음이 바로 앞에 오는 경우
                        if (Utils.charMedials.indexOf(msgAlphabet[i-1])!== -1) {
                            // 맨 마지막이거나 뒤에 모음이 안 오면 앞 글자에 붙여쓰기
                            if ( i === msgAlphabet.length - 1 || Utils.charMedials.indexOf(msgAlphabet[i + 1]) === -1 ) {
                                singleSyllable.push(msgAlphabet[i]);
                                i++;
                            }
                            // 자음+ㅡ+ㅇ+모음 패턴
                            else if (i>1 && Utils.charInitials.indexOf(msgAlphabet[i-2])!== -1  && msgAlphabet[i-1] ==='ㅡ') {
                                singleSyllable.push(msgAlphabet[i]);
                                i++;
                            }
                            // 자음+단모음+ㅇ+유사모음 패턴 - ㅇ과 유사모음을 앞음절로
                            else if (i>1 && i<msgAlphabet.length-1 && Utils.charInitials.indexOf(msgAlphabet[i-2])!==-1 &&
                                Object.keys(vowelLast).indexOf(msgAlphabet[i-1])!== -1 && vowelLast[msgAlphabet[i-1]].indexOf(msgAlphabet[i+1]) !== -1) {
                                singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                i +=2;
                            }
                            // 자음+ㅣ+ㅇ+단모음 -> 자음+복모음 처리를 위해 ㅇ을 앞에 붙임.
                            else if (i>1 && i < msgAlphabet.length - 1 && Utils.charInitials.indexOf(msgAlphabet[i - 2]) !== -1 &&
                                msgAlphabet[i - 1] === 'ㅣ' && Object.keys(yVowel).indexOf(msgAlphabet[i + 1]) !== -1 && Utils.charMedials.indexOf(msgAlphabet[i+2]) === -1) {
                                singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                i +=2;
                            }
                                // 자음 + 모음+ ㅇ+모음 -> 복모음 형성가능한 경우
                            // 자음 + 모음 + ㅇ + 모음에서 앞모음+뒷모음이 복모음을 형성할 수 있는 경우 ㅇ을 앞에 붙임
                            else if (i>1 && i < msgAlphabet.length - 1 && Utils.charMedials.indexOf(msgAlphabet[i - 1]) !== -1 && Utils.charMedials.indexOf(msgAlphabet[i + 1]) !== -1 &&
                                Utils.charInitials.indexOf(msgAlphabet[i - 2]) !== -1 ) {

                                if (Utils.objectIn([msgAlphabet[i-1], msgAlphabet[i+1]], vowelPair)) {
                                    singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                    i +=2;
                                }
                                // 나머지 경우는 음절 나누기
                                else {
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [msgAlphabet[i]];
                                    i++;
                                }
                            }
                            // 복모음+ㅇ+모음에서 뒷모음이 복모음과 겹침. 궈어 -> 궈
                            else if (2 < i < msgAlphabet.length - 1 && Utils.charInitials.indexOf(msgAlphabet[i - 3]) !== -1 &&
                                Utils.charMedials.indexOf(msgAlphabet[i-1])!==-1 && msgAlphabet[i + 1] === msgAlphabet[i -1] &&
                                Utils.isDouble(msgAlphabet[i-2], msgAlphabet[i-1]) === true && !(msgAlphabet[i-2]==='ㅗ' && msgAlphabet[i-1]==='ㅣ') ) {
                                singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                i +=2;
                            }
                            // 나머지 케이스는 ㅇ으로 시작하는 글자 분리
                            else {
                                divideSyllable.push(singleSyllable);
                                singleSyllable = [msgAlphabet[i]];
                                i++;
                            }

                        }
                        // 자음이 바로 앞에 오는 경우
                        else if (Utils.charInitials.indexOf(msgAlphabet[i-1])!== -1) {
                            // 뒤에 모음이 올 때+앞에 ㅇ 아닌 자음이 올 때 앞 음절에 붙이기
                            if (i>1 && i < msgAlphabet.length - 1 && msgAlphabet[i - 1] !== 'ㅇ' && Utils.charMedials.indexOf(msgAlphabet[i + 1]) !== -1) {
                                singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                i +=2;
                            }
                            // 나머지는 ㅇ을 시작으로 음절 분리
                            else {
                                divideSyllable.push(singleSyllable);
                                singleSyllable = [msgAlphabet[i]];
                                i++;
                            }
                        }
                        // 나머지는 ㅇ을 시작으로 음절 분리
                        else {
                            divideSyllable.push(singleSyllable);
                            singleSyllable = [msgAlphabet[i]];
                            i++;
                        }
                    }

                    // ㅇ 아닌 자음일 때
                    else if (Utils.charInitials.indexOf(msgAlphabet[i]) !== -1 && msgAlphabet[i] !== 'ㅇ') {
                        // 앞에 모음일 경우
                        if ( Utils.charMedials.indexOf(msgAlphabet[i - 1]) !== -1) {
                            // 뒷자음과 겹받침을 형성하는 경우
                            if (Utils.objectIn([msgAlphabet[i], msgAlphabet[i+1]], Utils.doubleConsonant)) {

                                // 맨 마지막에 오거나 뒤에 모음 또는 ㅇ,ㅎ, 중복모음이 오지 않을 때
                                if ( i >= msgAlphabet.length -2 ||
                                    (Utils.charMedials.indexOf(msgAlphabet[i + 2]) === -1 && msgAlphabet[i + 2] !== 'ㅇ' && msgAlphabet[i+2]!== 'ㅎ'
                                        && !ObjectOperation.objectIn(msgAlphabet[i+1], Utils.jointConsonant[msgAlphabet[i+2]])  ) ) {
                                    singleSyllable = singleSyllable.concat( [msgAlphabet[i], msgAlphabet[i+1]] );
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = msgAlphabet[i+2]!==undefined?[msgAlphabet[i+2]]:[]
                                    i +=3;
                                }
                                // 뒤에 ㅇ, ㅎ, 중복자음이 오지만 그래도 그 다음에 모음이 안 올 때
                                else if ( i<msgAlphabet.length-2 &&
                                    (msgAlphabet[i+2] === 'ㅇ' || msgAlphabet[i+2] === 'ㅎ' || ObjectOperation.objectIn(msgAlphabet[i+1], Utils.jointConsonant[msgAlphabet[i+2]]))
                                    && Utils.charMedials.indexOf(msgAlphabet[i+3])=== -1) {
                                    singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [ msgAlphabet[i+2] ]
                                    i +=3;
                                }
                                // 뒷자음 중복시- 뒤로 넘기기.
                                else if (i<msgAlphabet.length-2 &&
                                    ObjectOperation.objectIn(msgAlphabet[i+1], Utils.jointConsonant[msgAlphabet[i+2]])
                                ) {
                                    singleSyllable.push(msgAlphabet[i]);
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [msgAlphabet[i+1], msgAlphabet[i+2]];
                                    i +=3;
                                }
                                // 뒤에 ㅎ이 올 때 - 뒷모음으로 밀기
                                else if (i<msgAlphabet.length-2 && msgAlphabet[i+2]=== 'ㅎ') {
                                    // ㅎ 비음으로 밀어낼 수 있는 경우 한정
                                    if ( Object.keys(aspiritedSound).indexOf(msgAlphabet[i+1]) !==-1 ) {
                                        singleSyllable.push(msgAlphabet[i])
                                        divideSyllable.push(singleSyllable);
                                        singleSyllable = [msgAlphabet[i+1], msgAlphabet[i+2]];
                                        i +=3;
                                    }
                                    // 안 그런 경우는 그냥 통상적으로 나누기
                                    else {
                                        singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                        i +=2;
                                    }
                                }
                                // 뒤에 ㅇ이 올 때 - 뒷모음으로 밀기
                                else if (i<msgAlphabet.length -2 && msgAlphabet[i+2] === 'ㅇ') {
                                    singleSyllable.push(msgAlphabet[i])
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [msgAlphabet[i+1], msgAlphabet[i+2]];
                                    i +=3;
                                }
                                // 혹시 나머지 경우는...
                                else {
                                    singleSyllable = singleSyllable.concat([msgAlphabet[i], msgAlphabet[i+1]]);
                                    i +=2;
                                }

                            }
                            // 아닌 경우
                            else {
                                // 맨 마지막에 오거나 뒤에 모음 또는 ㅇ,ㅎ, 중복모음이 오지 않을 때
                                if ( i === msgAlphabet.length -1 ||
                                    (Utils.charMedials.indexOf(msgAlphabet[i + 1]) === -1 && msgAlphabet[i + 1] !== 'ㅇ' && msgAlphabet[i+1]!== 'ㅎ'
                                        && !ObjectOperation.objectIn(msgAlphabet[i], Utils.jointConsonant[msgAlphabet[i+1]])  ) ) {
                                    singleSyllable.push(msgAlphabet[i]);
                                    i++;
                                }
                                // 뒤에 ㅇ, ㅎ, 중복자음이 오지만 그래도 그 다음에 모음이 안 올 때
                                else if ( i<msgAlphabet.length-1 &&
                                    (msgAlphabet[i+1] === 'ㅇ' || msgAlphabet[i+1] === 'ㅎ' || ObjectOperation.objectIn(msgAlphabet[i], Utils.jointConsonant[msgAlphabet[i+1]]))
                                    && Utils.charMedials.indexOf(msgAlphabet[i+2])=== -1) {
                                    singleSyllable.push(msgAlphabet[i]);
                                    i++;
                                }
                                // 뒷자음 중복시- 뒤로 밀어내기
                                else if (i<msgAlphabet.length-1 &&
                                    ObjectOperation.objectIn(msgAlphabet[i], Utils.jointConsonant[msgAlphabet[i+1]])
                                ) {
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [msgAlphabet[i], msgAlphabet[i+1]];
                                    i +=2;
                                }
                                // 뒤에 ㅎ이 올 때 - 뒷모음으로 밀기
                                else if (i<msgAlphabet.length-1 && msgAlphabet[i+1]=== 'ㅎ') {
                                    // ㅎ 비음으로 밀어낼 수 있는 경우 한정
                                    if ( Object.keys(aspiritedSound).indexOf(msgAlphabet[i]) !==-1 ) {
                                        divideSyllable.push(singleSyllable);
                                        singleSyllable = [msgAlphabet[i], msgAlphabet[i+1]];
                                        i +=2;
                                    }
                                    // 안 그런 경우는 그냥 통상적으로 나누기
                                    else {
                                        singleSyllable.push(msgAlphabet[i]);
                                        i++;
                                    }
                                }
                                // 뒤에 ㅇ이 올 때 - 뒷모음으로 밀기
                                else if (i<msgAlphabet.length -1 && msgAlphabet[i+1] === 'ㅇ') {
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [msgAlphabet[i], msgAlphabet[i+1]];
                                    i +=2;
                                }
                                // 혹시 나머지 경우는...
                                else {
                                    divideSyllable.push(singleSyllable);
                                    singleSyllable = [msgAlphabet[i] ];
                                    i++;
                                }

                            }

                        }

                        // 나머지 - 뒷글자로 넘기기
                        else {
                            divideSyllable.push(singleSyllable);
                            singleSyllable = [msgAlphabet[i]];
                            i++;
                        }
                    }

                    // 자음 바로 뒤 모음 - 앞글자에 붙인다.
                    else if (Utils.charMedials.indexOf(msgAlphabet[i]) !== -1 && Utils.charInitials.indexOf(msgAlphabet[i - 1]) !== -1) {
                        singleSyllable.push(msgAlphabet[i]);
                        i++;
                    }
                    // 겹모음 - 앞글자에 붙인다.
                    else if (i > 1 && Utils.charInitials.indexOf(msgAlphabet[i - 2]) !== -1 && Utils.charMedials.indexOf(msgAlphabet[i - 1]) !== -1) {
                        var tmp = true;
                        if (Utils.objectIn([msgAlphabet[i-1], msgAlphabet[i]], Utils.doubleVowel)) {
                            singleSyllable.push(msgAlphabet[i]);
                            tmp = false;
                            i++;
                        }

                        if (tmp) {
                            divideSyllable.push(singleSyllable);
                            singleSyllable = [msgAlphabet[i]];
                            i++;
                        }
                    }
                    // 나머지 케이스
                    else {
                        divideSyllable.push(singleSyllable);
                        singleSyllable = [msgAlphabet[i]];
                        i++;
                    }

                }

            }
            //마지막 문자 밀어넣기
            if (singleSyllable.length>0) divideSyllable.push(singleSyllable);

            let ind =0;
            for (i =0; i<divideSyllable.length; i++) {
                let cnt = 0, assembledSyllable =  Hangul.assemble(divideSyllable[i]);
                for (var leti in assembledSyllable ) { // 한글 숫자 조합. Hangul.assemble로 조합.
                    // 한글 자음이면서 낱자 바로 뒤나 앞에 한글이 오지 않으면 cnt 늘리기...
                    if (!/[ㄱ-ㅎ]/.test( assembledSyllable[leti] )  ) cnt++;
                    else if (leti > 0 && !/[가-힣]/.test( assembledSyllable[leti-1] ) ) cnt++;
                    else if (leti === 0 && !/[가-힣]/.test( assembledSyllable[leti+1] ) ) cnt++;
                }
                if (res[Hangul.assemble(divideSyllable[i])]) {
                    res[Hangul.assemble(divideSyllable[i])]["index"].push(ind);
                }
                else {
                    res[Hangul.assemble(divideSyllable[i])] = {
                        value: Utils.dropDouble(Hangul.assemble(divideSyllable[i]), false, simplify),
                        index: [ind]
                    }
                }
                ind += cnt;

            }

            return res;
        }


    },

    //ㅄ받침, ㄻ받침, ㄺ받침 과잉으로 사용하는 메시지 검출.
    tooMuchDoubleEnd: (msg) => {
        const newMsg = msg.split("").filter(x=> (/[가-힣]/.test(x))); // 한글만 추출하는 메시지
        let cnt = 0;
        let contCnt =0; // 연속
        let pos = []; // 위치 찾기
        for (var i in msg) {
            // ㅄ, ㄺ, ㄻ 받침이 있는 문자 잡아내기
            if (
                msg[i].charCodeAt() >=44032 && msg[i].charCodeAt() <=55203 &&
                ( [6, 25, 26].indexOf(msg[i].charCodeAt %28) )  //ㅄ 받침 : 나머지6, ㄺ 받침: 나머지 25, ㄻ 받침: 나머지 26
            ) {
                cnt++;
                contCnt++;
                pos.push(i);
            }
            else {
                contCnt =0;
            }
        }
        if (contCnt>2 && (newMsg.length/cnt)<=3) {
            let txt =[]
            for (i in msg) {
                if (pos.indexOf(i)>-1)
                    txt.push(msg[i]);
            }
            return {val:true, pos:pos, txt:txt};
        }
        else {
            return {val:false, pos:[], txt:[]};
        }
    },

    // 영어발음 -> 한글로 치환하기.
    romanToHangul(msg, isMap =false) {

    }
}

module.exports = Utils;
