let Hangul = require('hangul-js');
let fs = require('fs');
let Utils = require('./Utils');


// 사전데이터들을 배열형태로 저장해서 보관합니다. (json)
var badWords = [] // 비속어
var typeofBadWords = {} // 비속어 타입별로 분류하기
var normalWords = [] // 정상단어
var softSearchWords = [] // 저속한 단어
var exceptWords = [] // 정상단어에서 제외할 단어.
var badWordMacros = {} // 반복적으로 사용하는 매크로 정의하기.

// 빠른 비속어단어 확인을 위해 사전에
// 단어목록을 한글자씩 조각내놓고 사용합니다.
var parsedBadWords = []
var parsedSoftSearchWords = []
var parsedDrugWords = []
var parsedInsultWords = []
var parsedSexualityWords = []
var parsedViolenceWords = []

// 정상단어/예외처리된 단어들도 파싱해서 처리해보자.
// var parsedNormalWords = []
// var parsedExceptWords = []

// 유동적인 비속어 목록 관리를 위해 이미 배열에
// 특정 단어가 존재하는지를 확인하기위해 해시맵을 사용합니다.
var badWordsMap = {}
var normalWordsMap = {}
var softSearchWordsMap = {}
var exceptWordsMap = {}
var typeofBadWordsMap = {drug:{}, insult:{}, sexuality:{}, violence:{}}


class Tetrapod {

    // badWord, 정상단어, softSearchWord 불러오기
    static load(inputBadwords, inputDictionary, inputSoftSearchWords, inputExceptWords, inputTypeofBadWords, inputBadWordMacros, disableAutoParse = true) {
        badWords = inputBadwords
        normalWords = inputDictionary
        softSearchWords = inputSoftSearchWords
        exceptWords = inputExceptWords
        typeofBadWords = inputTypeofBadWords
        badWordMacros = inputBadWordMacros

        console.log("LOADING...", new Date().getTime())

        if (disableAutoParse != false) {
            this.parse();
            this.sortAll();
            this.mapping();

        }
    }

    // qwertyToDubeol test
    static qwertyToDubeol (msg, isMap) {
        return Utils.qwertyToDubeol(msg, isMap);
    }

    // antispooftest
    static antispoof(msg, isMap) {
        return Utils.antispoof(msg, isMap);
    }

    // dropDouble Test
    static dropDouble(msg, isMap) {
        if (/[가-힣|ㅏ-ㅣ|ㄱ-ㅎ \s]/.test(msg)) {
            return Utils.dropDouble(msg, isMap);
        }
    }

    // tooMuchDoubleEnd test
    static tooMuchDoubleEnd(msg) {
        if (/[가-힣\s]/.test(msg)) {
            return Utils.tooMuchDoubleEnd(msg);
        }
    }

    // 비속어 사전 파일 로딩함.
    static loadFile(badWordsPath, normalWordsPath, softSearchWordsPath, macrosPath, disableAutoParse) {
        let data = {
            badWords: require(badWordsPath).badwords,
            normalWords: require(normalWordsPath).dictionary,
            exceptWords: require(normalWordsPath).exception,
            softSearchWords: require(softSearchWordsPath).badwords,
            typeofBadWords: {
                drug: require(badWordsPath).drug,
                insult:require(badWordsPath).insult,
                sexuality: require(badWordsPath).sexuality,
                violence: require(badWordsPath).violence
            },
            badWordMacros: require(macrosPath),
        }
        this.load(data.badWords, data.normalWords, data.softSearchWords, data.exceptWords, data.typeofBadWords, data.badWordMacros, disableAutoParse)
    }

    // 기본 비속어 사전의 목록 로드. 사용방법 - Tetrapod.defaultLoad()
    static defaultLoad() {
        let data = this.getDefaultData()
        // console.log(Object.keys(data))
        console.log("defaultLoad", new Date().getTime())
        this.load(data.badWords, data.normalWords, data.softSearchWords, data.exceptWords, data.typeofBadWords, data.badWordMacros)
    }

    static showBadWordsMap() {
        console.log(badWordsMap)
    }

    // 리스트 형식으로 된 BadWord 단어들을 wordToArray 이용해서 1차원 배열로 풀어쓰기.
    static parse() {
        parsedBadWords = []
        parsedSoftSearchWords = []
        parsedDrugWords = []
        parsedInsultWords = []
        parsedSexualityWords = []
        parsedViolenceWords =[]
        // parsedNormalWords = []
        // parsedExceptWords = []

        console.log("Parsing Start", new Date().getTime())
        // exceptWords 파싱
        // for (let index in exceptWords) {
        //     if (!Utils.objectIn(Utils.wordToArray(exceptWords[index]), parsedExceptWords)) {
        //         parsedExceptWords.push(Utils.wordToArray(exceptWords[index]))
        //     }
        // }
        // NormalWords 파싱
        // for (let index in normalWords) {
        //     if ( !Utils.objectIn(Utils.wordToArray(normalWords[index]), parsedNormalWords)) {
        //         parsedNormalWords.push(Utils.wordToArray(normalWords[index]))
        //     }
        // }
        // softSearchWord 파싱
        for (let index in softSearchWords) {
            // if (!this.testInList( Utils.wordToArray(softSearchWords[index]), parsedSoftSearchWords ) )
                parsedSoftSearchWords.push(Utils.wordToArray(softSearchWords[index]))
        }
        // softSearchWords에 들어가지 않는 단어들만 집어넣기
        for (let index in typeofBadWords.drug) {
            // if (
            //    !this.testInList( Utils.wordToArray(typeofBadWords.drug[index]), parsedDrugWords )
                // && !Utils.objectIn(Utils.wordToArray(typeofBadWords.drug[index]), parsedSoftSearchWords)
            //)
                parsedDrugWords.push(Utils.wordToArray(typeofBadWords.drug[index]))
        }
        for (let index in typeofBadWords.insult) {
            // if (
            //    !this.testInList( Utils.wordToArray(typeofBadWords.insult[index]), parsedInsultWords )
            //     // && !Utils.objectIn(Utils.wordToArray(typeofBadWords.insult[index]), parsedSoftSearchWords)
            // )
                parsedInsultWords.push(Utils.wordToArray(typeofBadWords.insult[index]))
        }
        for (let index in typeofBadWords.sexuality) {
            // if (
            //     !this.testInList( Utils.wordToArray(typeofBadWords.sexuality[index]), parsedSexualityWords )
            //    // && !Utils.objectIn(Utils.wordToArray(typeofBadWords.sexuality[index]), parsedSoftSearchWords)
            //)
                parsedSexualityWords.push(Utils.wordToArray(typeofBadWords.drug[index]))
        }
        for (let index in typeofBadWords.violence) {
            // if (
            //    !this.testInList( Utils.wordToArray(typeofBadWords.violence[index]), parsedViolenceWords )
            //    // && !Utils.objectIn(Utils.wordToArray(typeofBadWords.violence[index]), parsedViolenceWords)
            //)
                parsedViolenceWords.push(Utils.wordToArray(typeofBadWords.violence[index]))
        }


        // softSearchWords나 위의 분류에 들어가지 않은 단어들만 집어넣게 변경.
        for (let index in badWords) {
            // if (
            //    !this.testInList( Utils.wordToArray(badWords[index]), parsedBadWords )
                // && !Utils.objectIn(Utils.wordToArray(badWords[index]), parsedSoftSearchWords)
                // && !Utils.objectIn(Utils.wordToArray(badWords[index]), parsedDrugWords)
                // && !Utils.objectIn(Utils.wordToArray(badWords[index]), parsedInsultWords)
                // && !Utils.objectIn(Utils.wordToArray(badWords[index]), parsedSexualityWords)
                // && !Utils.objectIn(Utils.wordToArray(badWords[index]), parsedViolenceWords)
            // )
                parsedBadWords.push(Utils.wordToArray(badWords[index]))
        }

        console.log("before Sorting Words", new Date().getTime())
        // 단어의 길이 역순으로 정렬
        parsedBadWords.sort((a,b)=> a.length-b.length).reverse();
        parsedSoftSearchWords.sort((a,b)=> a.length-b.length).reverse();
        parsedDrugWords.sort((a,b)=> a.length-b.length).reverse();
        parsedInsultWords.sort((a,b)=> a.length-b.length).reverse();
        parsedSexualityWords.sort((a,b)=> a.length-b.length).reverse();
        parsedViolenceWords.sort((a,b)=> a.length-b.length).reverse();

        console.log("parseWords", new Date().getTime())

    }

    // 비교시간 단축을 위한 테크닉.
    // 리스트들의 목록 List에 대해 리스트 elem이 List 안에 있는지 판별하기.
    static testInList(elem, List) {
        // 우선 길이가 같은 tempList만 추출하기
        let sameLengthList = List.filter(x=>(x.length=== elem.length))

        // 각 원소에 대해 objectEqual을 이용해서 체크하기
        for (let i in List) {
            sameLengthList = sameLengthList.filter(x=> (Utils.objectEqual(List[i], x[i])))
            if (sameLengthList.length ===0 ) return false;
        }
        // 리스트 안에 있으면 true, 없으면 false
        if (sameLengthList.length>0) return true;
        else return false;
    }

    // 목록을 맵으로 지정.
    static mapping() {
        badWordsMap = {}
        normalWordsMap = {}
        softSearchWordsMap = {}
        exceptWordsMap = {}
        typeofBadWordsMap = {drug:{}, insult:{}, sexuality:{}, violence:{}}

        for (let word of badWords)
            badWordsMap[word] = true
        for (let word of normalWords)
            normalWordsMap[word] = true
        for (let word of softSearchWords)
            softSearchWordsMap[word] = true
        for (let word of exceptWords)
            exceptWordsMap[word] = true
        for (let word of typeofBadWords.drug)
            typeofBadWordsMap.drug[word] = true
        for (let word of typeofBadWords.insult)
            typeofBadWordsMap.insult[word] = true
        for (let word of typeofBadWords.sexuality)
            typeofBadWordsMap.sexuality[word] = true
        for (let word of typeofBadWords.violence)
            typeofBadWordsMap.violence[word] = true
    }

    // 맵 정렬하기 - 그냥 parsedBadWords에 순서 맞춰주기.
    static sortBadWordsMap() {
        badWords = parsedBadWords.length>0? parsedBadWords.map(x=> x.join("")):[];
        typeofBadWords = {
            drug: parsedDrugWords.length>0 ? parsedDrugWords.map(x=> x.join("")):[],
            insult: parsedInsultWords.length>0 ? parsedInsultWords.map(x=>x.join("")) :[],
            sexuality: parsedSexualityWords.length>0 ? parsedSexualityWords.map(x=>x.join("")):[],
            violence: parsedViolenceWords.length>0 ? parsedViolenceWords.map(x=> x.join("")):[]
        }
    }

    static sortNormalWordsMap() {
        normalWords = Utils.sortMap(normalWords);
        exceptWords = Utils.sortMap(exceptWords);
    }

    static sortSoftSearchWordsMap() {
        softSearchWords = parsedSoftSearchWords.length>0 ? parsedSoftSearchWords.map (x=> x.join("")): [];
    }

    static sortAll() {
        this.sortBadWordsMap()
        this.sortNormalWordsMap()
        this.sortSoftSearchWordsMap()
        console.log("sortAll", new Date().getTime())
    }

    // 기본 데이터 불러오기
    static getDefaultData() {
        let badWordMacros = require('./dictionaries/macros.json')
        for (var x in badWordMacros) {
            if (typeof badWordMacros[x] === "object") badWordMacros[x] = this.recursiveList(badWordMacros[x])
        }
        console.log("getDefaultData", new Date().getTime())
        return {
            badWords: this.assembleHangul( this.recursiveList(require('./dictionaries/bad-words.json').badwords, badWordMacros) ),
            normalWords: this.assembleHangul( this.recursiveList(require('./dictionaries/normal-words.json').dictionary, badWordMacros) ),
            exceptWords: this.assembleHangul( this.recursiveList(require('./dictionaries/normal-words.json').exception, badWordMacros) ),
            softSearchWords: this.assembleHangul( this.recursiveList(require('./dictionaries/soft-search-words.json').badwords, badWordMacros)),
            typeofBadWords: {
                drug: this.assembleHangul(this.recursiveList(require('./dictionaries/bad-words.json').drug, badWordMacros)),
                insult: this.assembleHangul(this.recursiveList(require('./dictionaries/bad-words.json').insult, badWordMacros)),
                sexuality: this.assembleHangul(this.recursiveList(require('./dictionaries/bad-words.json').sexuality, badWordMacros)),
                violence : this.assembleHangul(this.recursiveList(require('./dictionaries/bad-words.json').violence, badWordMacros)),
            },
            badWordMacros
        }
    }

    // 사용자 정의 데이터 불러오기
    static getLoadedData() {
        return {
            badWords: badWords,
            normalWords: normalWords,
            exceptWords: exceptWords,
            softSearchWords: softSearchWords,
            typeofBadWords : typeofBadWords,
            badWordMacros: badWordMacros,
        }
    }

    // 데이터 저장
    static saveAllData(badWordsPath, normalWordsPath, softSearchWordsPath, badWordMacrosPath, isAsync) {
        this.saveBadWordsData(badWordsPath, isAsync)
        this.saveNormalWordsData(normalWordsPath, isAsync)
        this.saveSoftSearchWordsData(softSearchWordsPath, isAsync)
        this.saveBadWordMacros(badWordMacrosPath, isAsync)
    }

    // 비속어 데이터 저장
    static saveBadWordMacros(path, isAsync) {
        let data = JSON.stringify(
            badWordMacros, null, 4
        );
        if(isAsync) fs.writeFile(path, data)
        else fs.writeFileSync(path, data)
    }

    static saveBadWordsData(path, isAsync) {
        this.sortBadWordsMap()

        let data = JSON.stringify({
            badwords: badWords,
            drug: typeofBadWords.drug,
            insult: typeofBadWords.insult,
            sexuality: typeofBadWords.sexuality,
            violence: typeofBadWords.violence,
        }, null, 4)

        if(isAsync) fs.writeFile(path, data)
        else fs.writeFileSync(path, data)
    }

    static saveNormalWordsData(path, isAsync) {
        this.sortNormalWordsMap()

        let data = JSON.stringify({
            dictionary: normalWords,
            exception: exceptWords
        }, null, 4)

        if(isAsync) fs.writeFile(path, data)
        else fs.writeFileSync(path, data)
    }

    static saveSoftSearchWordsData(path, isAsync) {
        this.sortSoftSearchWordsMap()

        let data = JSON.stringify({
            badwords: softSearchWords
        }, null, 4)

        if(isAsync) fs.writeFile(path, data)
        else fs.writeFileSync(path, data)
    }


    // 메시지에 비속어가 들어갔는지 검사.
    static isBad(message, includeSoft=false, fromList = undefined) {
        if (fromList === undefined) {
            if (includeSoft === true)
                return (this.nativeFind(message, false).found.length >0 ||
                    this.nativeFind(message, false).softSearchFound.length >0 ||
                    this.nativeFind(message, false).tooMuchDoubleEnd.val
                );
            else
                return this.nativeFind(message, false).found.length>0;
        }
            // fromList가 리스트 형식으로 주어지면 includeSoft와 무관하게 fromList 안에 있는 함수만 검출
        // fromList는 단어 리스트 또는 파싱된 단어 리스트 중 하나 입력 가능.
        else if (Array.isArray(fromList)) {
            return (this.nativeFindFromList(message, fromList, false).found.length > 0)
        }
    }

    // 메시지에 비속어가 몇 개 있는지 검사.
    static countBad(message, isStrong=false) {

        if (isStrong) {
            let searchResult = this.find(message, true, 0, false, true);
            // totalResult
            let bad = 0;
            // softResult
            let soft = 0;
            // originalTotalResult
            let bad2 = 0;
            // originalSoftResult
            let soft2 = 0;
            for (var x of searchResult.totalResult) {
                bad += x.positions.length
            }
            for (var x of searchResult.softResult) {
                soft += x.positions.length
            }
            for (var x of searchResult.originalTotalResult) {
                bad2 += x.positions.length
            }
            for (var x of searchResult.originalSoftResult) {
                soft2 += x.positions.length
            }

            return {bad: Math.max(bad, bad2), soft: Math.max(soft, soft2), end:searchResult.endResult.length};
        }
        else {
            return {
                bad: this.find(message, true, 0, false).totalResult.length,
                soft: this.find(message, true, 0, false).softResult.length,
                end: this.find(message, true, 0, false).endResult.length,
            };
        }

    }

    // 메시지에 비속어 찾기 - 배열로 처리함.
    static find(message, needMultipleCheck=false, splitCheck=15, qwertyToDubeol=false, isStrong=false) {
        // 욕설 결과 집합
        let totalResult = []
        let softResult = []
        let tooMuchEnds = []
        let originalTotalResult = []; // isStrong을 참으로 했을 때 결과 수집
        let originalSoftResult = []; // isStrong을 참으로 했을 때 결과 수집

        //보조 메시지
        let message2Map = {};
        let message2 = ''
        let message3Map = {}
        let message3 = ''
        let message4Map = {}


        if (qwertyToDubeol === true && isStrong === false) { // 만약 한영 검사가 필요하면...
            message2Map = Utils.qwertyToDubeol(message, true);
            message2 = Utils.qwertyToDubeol(message, false); // 2차 점검용
        }
        if (isStrong === true) { // 문자열을 악용한 것까지 잡아보자.
            message3Map = Utils.antispoof(message, true);
            message3 = Utils.antispoof(message, false);
            message4Map = Utils.dropDouble(message3, true, false);
        }

        if (splitCheck === undefined) splitCheck = 15
        var messages = (splitCheck != 0) ? Utils.lengthSplit(message, splitCheck) : [message];

        // 일단 한영전환은 나누어서 검사하는 기능 제거. 추후 구현 예정.
        // var messages2 = (splitCheck != 0) ? Utils.lengthSplit(message2, splitCheck) : [message2];

        // 정밀 검사 때에는 메시지 나누어서 검사하지 말자.
        // if (message3.length>0) var messages3 =  [message3]
        // if (message4.length>0) var messages4 =  [message4]
        // if (message5.length>0) var messages5 =  [message5]


        // 메시지 나누어서 확인하기.

        if (!isStrong) {
            for (var index1 = 0; index1 <= messages.length - 1; index1++) {
                let currentResult = this.nativeFind(messages[index1], needMultipleCheck)
                let currentResultDrug = this.nativeFind(messages[index1], needMultipleCheck, false, false, "drug")
                let currentResultInsult = this.nativeFind(messages[index1], needMultipleCheck, false, false, "insult")
                let currentResultSexuality = this.nativeFind(messages[index1], needMultipleCheck, false, false, "sexuality")
                let currentResultViolence = this.nativeFind(messages[index1], needMultipleCheck, false, false, "violence")
                tooMuchEnds.push(currentResult.tooMuchDoubleEnd);

                // 중복체크가 포함될 때에는 각 단어를 모두 추가해준다.
                if (needMultipleCheck) {
                    for (var index2 = 0; index2 <= currentResult.found.length - 1; index2++) {
                        if (currentResult.found !== [] && totalResult.map(v=>v.value).indexOf(currentResult.found[index2])===-1)
                            totalResult = [...totalResult, {value:currentResult.found[index2], positions:currentResult.positions[index2]}];
                    }
                    for (index2 = 0; index2 <= currentResult.softSearchFound.length - 1; index2++) {
                        if (currentResult.softSearchFound !== [] && softResult.map(v=>v.value).indexOf(currentResult.softSearchFound[index2])===-1)
                            softResult = [...softResult, {value:currentResult.softSearchFound[index2], positions:currentResult.softSearchPositions[index2]}];
                    }
                    for (index2 = 0; index2 <= currentResultDrug.found.length - 1; index2++) {
                        if (currentResultDrug.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultDrug.found[index2])===-1)
                            totalResult = [...totalResult, {value:currentResultDrug.found[index2], positions:currentResultDrug.positions[index2], type:"drug"}];
                    }
                    for (index2 = 0; index2 <= currentResultInsult.found.length - 1; index2++) {
                        if (currentResultInsult.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultInsult.found[index2])===-1)
                            totalResult = [...totalResult, {value:currentResultInsult.found[index2], positions:currentResultInsult.positions[index2], type:"insult"}];
                    }
                    for (index2 = 0; index2 <= currentResultSexuality.found.length - 1; index2++) {
                        if (currentResultSexuality.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultSexuality.found[index2])===-1)
                            totalResult = [...totalResult, {value:currentResultSexuality.found[index2], positions:currentResultSexuality.positions[index2], type:"sexuality"}];
                    }
                    for (index2 = 0; index2 <= currentResultViolence.found.length - 1; index2++) {
                        if (currentResultViolence.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultViolence.found[index2])===-1)
                            totalResult = [...totalResult, {value:currentResultViolence.found[index2], positions:currentResultViolence.positions[index2], type:"violence"}];
                    }
                } else {
                    if (currentResult !== null){
                        totalResult = [...totalResult, currentResult.found];
                        softResult = [...softResult, currentResult.softSearchFound];
                    }
                    if (currentResultDrug !== null) {
                        totalResult = [...totalResult, currentResultDrug.found];
                    }
                    if (currentResultInsult !== null) {
                        totalResult = [...totalResult, currentResultInsult.found];
                    }
                    if (currentResultSexuality !== null) {
                        totalResult = [...totalResult, currentResultSexuality.found];
                    }
                    if (currentResultViolence !== null) {
                        totalResult = [...totalResult, currentResultViolence.found];
                    }
                }
            }
            // qwertyToDubeol를 잡을 때
            if (totalResult.length ===0 && qwertyToDubeol === true) {
                let currentResult = this.nativeFind(message2Map, needMultipleCheck, true);
                let currentResultDrug = this.nativeFind(message2Map,needMultipleCheck, true, false, "drug")
                let currentResultInsult = this.nativeFind(message2Map, needMultipleCheck,true, false, "insult")
                let currentResultSexuality = this.nativeFind(message2Map,needMultipleCheck, true, false, "sexuality")
                let currentResultViolence = this.nativeFind(message2Map,needMultipleCheck, true, false, "violence")
                tooMuchEnds.push(currentResult.tooMuchDoubleEnd);

                if (needMultipleCheck) {

                    for (var index = 0; index <= currentResult.found.length - 1; index++) {
                        if (currentResult.found !== [] && totalResult.map(v=>v.value).indexOf(currentResult.found[index])===-1)
                            totalResult = [...totalResult, {value:currentResult.found[index], positions:currentResult.positions[index]}  ];
                    }
                    for (index = 0; index <= currentResult2.softSearchFound.length - 1; index++) {
                        if (currentResult.softSearchFound !== [] && softResult.map(v=>v.value).indexOf(currentResult.softSearchFound[index])===-1)
                            softResult = [...softResult, {value:currentResult.softSearchFound[index], positions:currentResult.softSearchPositions[index]}];
                    }
                    for (var index = 0; index <= currentResultDrug.found.length - 1; index++) {
                        if (currentResultDrug.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultDrug.found[index])===-1)
                            totalResult = [...totalResult, {value:currentResultDrug.found[index], positions:currentResultDrug.positions[index], type:"drug"}  ];
                    }
                    for (var index = 0; index <= currentResultInsult.found.length - 1; index++) {
                        if (currentResultInsult.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultInsult.found[index])===-1)
                            totalResult = [...totalResult, {value:currentResultInsult.found[index], positions:currentResultInsult.positions[index], type:"insult"}  ];
                    }
                    for (var index = 0; index <= currentResultSexuality.found.length - 1; index++) {
                        if (currentResultSexuality.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultSexuality.found[index])===-1)
                            totalResult = [...totalResult, {value:currentResultSexuality.found[index], positions:currentResultSexuality.positions[index], type:"sexuality"}  ];
                    }
                    for (var index = 0; index <= currentResultViolence.found.length - 1; index++) {
                        if (currentResultViolence.found !== [] && totalResult.map(v=>v.value).indexOf(currentResultViolence.found[index])===-1)
                            totalResult = [...totalResult, {value:currentResultViolence.found[index], positions:currentResultViolence.positions[index], type:"violence"}  ];
                    }
                } else {
                    if (currentResult !== null){
                        totalResult = [...totalResult, currentResult.found];
                        softResult = [...softResult, currentResult.softSearchFound];
                    }
                    if (currentResultDrug !== null) {
                        totalResult = [...totalResult, currentResultDrug.found];
                    }
                    if (currentResultInsult !== null) {
                        totalResult = [...totalResult, currentResultInsult.found];
                    }
                    if (currentResultSexuality !== null) {
                        totalResult = [...totalResult, currentResultSexuality.found];
                    }
                    if (currentResultViolence !== null) {
                        totalResult = [...totalResult, currentResultViolence.found];
                    }
                }

            }

        }
        else {
            let currentResult = this.nativeFind(message3Map, needMultipleCheck, true);
            let currentResultDrug = this.nativeFind(message3Map, needMultipleCheck, true, false, "drug")
            let currentResultInsult = this.nativeFind(message3Map, needMultipleCheck, true, false, "insult")
            let currentResultSexuality = this.nativeFind(message3Map, needMultipleCheck, true, false, "sexuality")
            let currentResultViolence = this.nativeFind(message3Map, needMultipleCheck, true, false, "violence")

            let currentResult2 = this.nativeFind(message4Map, needMultipleCheck, true, true);
            let currentResultDrug2 = this.nativeFind(message4Map,needMultipleCheck, true, true, "drug")
            let currentResultInsult2 = this.nativeFind(message4Map, needMultipleCheck, true, true, "insult")
            let currentResultSexuality2 = this.nativeFind(message4Map, needMultipleCheck, true, true, "sexuality")
            let currentResultViolence2 = this.nativeFind(message4Map, needMultipleCheck, true, true, "violence")
            tooMuchEnds.push(currentResult.tooMuchDoubleEnd);

            if (needMultipleCheck) {
                for (var index =0; index<currentResult.found.length; index++) {
                    if (currentResult.found !==[] && originalTotalResult.map(v=>v.value).indexOf(currentResult.found[index]) ===-1)
                        originalTotalResult = [...originalTotalResult, {value:currentResult.found[index], positions:currentResult.positions[index]}];
                }
                for (index =0; index< currentResult.softSearchFound.length; index++) {
                    if (currentResult.softSearchFound!==[] && softResult.map(v=>v.value).indexOf(currentResult.softSearchFound[index]===-1)) {
                        originalSoftResult = [...originalSoftResult, {value:currentResult.softSearchFound[index], positions: currentResult.softSearchPositions[index]}]
                    }
                }
                for (var index =0; index<currentResultDrug.found.length; index++) {
                    if (currentResultDrug.found !==[] && originalTotalResult.map(v=>v.value).indexOf(currentResultDrug.found[index]) ===-1)
                        originalTotalResult = [...originalTotalResult, {value:currentResultDrug.found[index], positions:currentResultDrug.positions[index], type:"drug"}];
                }
                for (var index =0; index<currentResultInsult.found.length; index++) {
                    if (currentResultInsult.found !==[] && originalTotalResult.map(v=>v.value).indexOf(currentResultInsult.found[index]) ===-1)
                        originalTotalResult = [...originalTotalResult, {value:currentResultInsult.found[index], positions:currentResultInsult.positions[index], type:"insult"}];
                }
                for (var index =0; index<currentResultSexuality.found.length; index++) {
                    if (currentResultSexuality.found !==[] && originalTotalResult.map(v=>v.value).indexOf(currentResultSexuality.found[index]) ===-1)
                        originalTotalResult = [...originalTotalResult, {value:currentResultSexuality.found[index], positions:currentResultSexuality.positions[index], type:"sexuality"}];
                }
                for (var index =0; index<currentResultViolence.found.length; index++) {
                    if (currentResultViolence.found !==[] && originalTotalResult.map(v=>v.value).indexOf(currentResultViolence.found[index]) ===-1)
                        originalTotalResult = [...originalTotalResult, {value:currentResultViolence.found[index], positions:currentResultViolence.positions[index], type:"violence"}];
                }

                for (index =0; index<currentResult2.found.length; index++) {
                    if (currentResult2.found !==[] && totalResult.map(v=>v.value).indexOf(currentResult2.found[index]) ===-1)
                        totalResult = [...totalResult, {value:currentResult2.found[index], positions:currentResult2.positions[index]}];
                }
                for (index =0; index< currentResult2.softSearchFound.length; index++) {
                    if (currentResult2.softSearchFound!==[] && softResult.map(v=>v.value).indexOf(currentResult2.softSearchFound[index]===-1)) {
                        softResult = [...softResult, {value:currentResult2.softSearchFound[index], positions: currentResult2.softSearchPositions[index]}]
                    }
                }
                for (var index =0; index<currentResultDrug2.found.length; index++) {
                    if (currentResultDrug2.found !==[] && totalResult.map(v=>v.value).indexOf(currentResultDrug2.found[index]) ===-1)
                        totalResult = [...totalResult, {value:currentResultDrug2.found[index], positions:currentResultDrug.positions[index], type:"drug"}];
                }
                for (var index =0; index<currentResultInsult2.found.length; index++) {
                    if (currentResultInsult2.found !==[] && totalResult.map(v=>v.value).indexOf(currentResultInsult2.found[index]) ===-1)
                        totalResult = [...totalResult, {value:currentResultInsult2.found[index], positions:currentResultInsult2.positions[index], type:"insult"}];
                }
                for (var index =0; index<currentResultSexuality2.found.length; index++) {
                    if (currentResultSexuality2.found !==[] && totalResult.map(v=>v.value).indexOf(currentResultSexuality2.found[index]) ===-1)
                        totalResult = [...totalResult, {value:currentResultSexuality2.found[index], positions:currentResultSexuality2.positions[index], type:"sexuality"}];
                }
                for (var index =0; index<currentResultViolence2.found.length; index++) {
                    if (currentResultViolence2.found !==[] && totalResult.map(v=>v.value).indexOf(currentResultViolence2.found[index]) ===-1)
                        totalResult = [...totalResult, {value:currentResultViolence2.found[index], positions:currentResultViolence2.positions[index], type:"violence"}];
                }

            }
            else {
                if (currentResult !== null){
                    originalTotalResult = [...originalTotalResult, currentResult.found];
                    originalSoftResult = [...originalSoftResult, currentResult.softSearchFound];
                }
                if (currentResultDrug !==null) originalTotalResult = [...originalTotalResult, currentResultDrug.found];
                if (currentResultInsult !==null) originalTotalResult = [...originalTotalResult, currentResultInsult.found];
                if (currentResultSexuality !==null) originalTotalResult = [...originalTotalResult, currentResultSexuality.found];
                if (currentResultViolence !==null) originalTotalResult = [...originalTotalResult, currentResultViolence.found];

                if (currentResult2 !== null){
                    totalResult = [...totalResult, currentResult2.found];
                    softResult = [...softResult, currentResult2.softSearchFound];
                }
                if (currentResultDrug2 !==null) totalResult = [...originalTotalResult, currentResultDrug.found];
                if (currentResultInsult2 !==null) originalTotalResult = [...originalTotalResult, currentResultInsult.found];
                if (currentResultSexuality2 !==null) originalTotalResult = [...originalTotalResult, currentResultSexuality.found];
                if (currentResultViolence2 !==null) originalTotalResult = [...originalTotalResult, currentResultViolence.found];

            }

        }
        // 결과값 - 보기 좋게 출력.
        let endResult = [];
        let originalResult = {};

        for (let tooMuchEnd of tooMuchEnds) {
            let posN = tooMuchEnd.pos.map(val=>parseInt(val));
            let endTxt = tooMuchEnd.txt;
            for (var i in posN) {
                if (endResult.length ==0 || posN[i]-posN[i-1]>1) {
                    endResult.push(endTxt[i]);
                }
                else {
                    endResult[endResult.length-1] += endTxt[i];
                }
            }
        }

        if (isStrong) originalResult = {originalTotalResult, originalSoftResult};

        return {totalResult, softResult, endResult, ...originalResult};
    }

    // 메시지의 비속어를 콘솔창으로 띄워서 찾기.
    static nativeFind(message, needMultipleCheck, isMap = false, isReassemble = false, type="") {

        // let unsafeMessage = message.toLowerCase()
        // let normalWordPositions = {}
        let foundBadWords = [];
        let foundBadOriginalWords = []; // isMap에서 original 단어
        let foundBadWordPositions = []
        let foundBadWordOriginalPositions = []; // isMap에서 original 단어 위치
        let foundSoftSearchWords = []
        let foundSoftSearchOriginalWords = [] // isMap에서 original Softsearch 단어
        let foundSoftSearchWordPositions = []
        let foundSoftSearchWordOriginalPositions = []; // isMap에서 original Softserach 단어 위치
        let originalMessageList = [];
        let originalMessageSyllablePositions = []; // 원래 음가 위치


        // Map으로 주어지면 newMessage에 대해 찾는다.
        let originalMessage = "";
        let newMessage ="";
        if (isMap) {
            // 맵을 파싱해서 찾아보자.
            originalMessageList = Utils.parseMap(message).messageList;
            // console.log(message);
            originalMessage = originalMessageList.join("");
            // dropDouble일 때에는 바ㅂ오 ->밥오로 환원하기 위해 originalMessage를 한글 조합으로
            originalMessage = isReassemble ? Hangul.assemble(Hangul.disassemble(originalMessage)): originalMessage;
            originalMessageSyllablePositions =  Utils.parseMap(message).messageIndex;
            newMessage = Utils.parseMap(message).parsedMessage.join("");
        }
        else {
            newMessage = message;
        }


        // 정상단어의 포지션을 찾습니다.
        // 형식 : [1,2,3,...]
        let normalWordPositions = this.findNormalWordPositions(newMessage, false)
        // console.log(normalWordPositions);



        // for (let index in normalWords) {
        //     if (newMessage.length == 0) break
        //     let searchedPositions = Utils.getPositionAll(newMessage, normalWords[index])
        //     for(let searchedPosition of searchedPositions) {
        //         if(searchedPosition !== -1) {
        //             // 정상단어 예외 포지션을 찾습니다.
        //             for (let index2 in exceptWords) {
        //                 let exceptionPositions = Utils.getPositionAll(newMessage, exceptWords[index2])
        //                 if (!Utils.objectIn(searchedPosition, exceptionPositions))
        //                     normalWordPositions[searchedPosition] = true
        //             }
        //         }
        //     }
        // }


        // 저속한 단어들을 한 단어식 순회합니다.
        for (let softSearchWord of parsedSoftSearchWords) {

            // 단순히 찾는 것으로 정보를 수집하는 것이 아닌 위치를 아예 수집해보자.
             // findCount 형태 : {바: [1,8], 보:[2,7,12]}등
            let findCount = {}
            // 저속한 단어 수집 형태. 이 경우는 [[1,2], [8,7]]로 수집된다.
            let softSearchWordPositions = []
            let isSkip = false;
            // 별 갯수 관련
            let parserLength = 0;

            // 이미 더 긴 단어에서 욕설을 찾았다면 그냥 넘어가보자.
            for (let alreadyFound of foundSoftSearchWords) {
                if (Utils.objectInclude(softSearchWord, alreadyFound.split(""))) {
                    isSkip = true; break;
                }
            }

            if(isSkip) continue;


            // 저속한 단어들을 한 단어씩
            // 순회하며 존재여부를 검사합니다.
            // character 형식 - 단어도 있을 수 있으나 뒤에 아무개 문자 !, ?가 포함될 수 있음.
            for (let character of softSearchWord) {

                let mainCharacter = character[0]

                let parserCharacter = character[1] // !, + 또는 ?, 정의 안 될수도 있음.
                parserLength = (parserCharacter === "!" || parserCharacter ==="+") ? character.length -2 : character.length-1; // ? 개수 추정.
                let nextCharacter = (parserLength===0 && softSearchWord.indexOf(character)<softSearchWord.length-1)
                    ? softSearchWord[ softSearchWord.indexOf(character)+1 ][0]: "" // 뒤의 낱자 수집.

                let softSearchOneCharacter = String(mainCharacter).toLowerCase();

                // 일단 저속한 단어의 리스트를 정의해서 수집한다. 또한 뒤의 ? 개수도 추정.
                findCount[softSearchOneCharacter] = []
                findCount[softSearchOneCharacter+"?"] = parserLength;

                // 저속한 단어의 글자위치를 수집합니다.

                // 메시지 글자를 모두 반복합니다.
                for (let index in newMessage) {

                    // 정상적인 단어의 글자일경우 검사하지 않습니다.
                    // 적발된 단어가 모두 정상포지션에 자리잡힌 경우 잡지 않는다.
                    if (Utils.objectIn(index, normalWordPositions)) continue

                    // 단어 한글자라도 들어가 있으면
                    // 찾은 글자를 기록합니다.
                    let unsafeOneCharacter = String(newMessage[index]).toLowerCase()
                    // parserCharacter가 !이면 동일 낱자뿐 아니라 유사 낱자에 해당하는 경우도 모두 수집한다.
                    if (parserCharacter==="!") {
                        // isKindChar 함수 활용
                        if (this.isKindChar(unsafeOneCharacter, softSearchOneCharacter, nextCharacter)) {
                            findCount[softSearchOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }

                    }
                    else if (parserCharacter === "+") {
                        if ( Utils.objectInclude( Hangul.disassemble(softSearchOneCharacter), Hangul.disassemble(unsafeOneCharacter), true) ) {
                            findCount[softSearchOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }
                    else {
                        if (softSearchOneCharacter === unsafeOneCharacter) {
                            findCount[softSearchOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }

                }
            }

            // 단어 포지션 리스트
            let positionsList = Utils.filterList(Object.values(findCount), "object")
            let numberOfQs = Utils.filterList(Object.values(findCount), "number")
            // 낱자 포지션 맵
            let possibleWordPositions = Utils.productList(positionsList);

            // softSearchWord의 원래 포지션 찾기
            let softSearchWordOriginalPositions = [];
            let originalSoftSearchWords = [];


            // 단어 포지션 리스트에서 for문을 돌려보자.
            for (let wordPosition of possibleWordPositions) {

                let tempSoftSearchWordPositions = [...wordPosition];

                // 넘어갈 필요가 있는지 확인해보기
                let isNeedToPass = false
                // 순서가 바뀌었는지도 체크해보자.
                let isShuffled = false

                // 포지션 체크. 단어에서 뒤에 올 글자가 앞에 올 글자보다 3글자 이상 앞에 오면 isNeedToPass를 띄운다.
                for (var pos =0; pos<wordPosition.length; pos++) {
                    for (var pos1 =0; pos1<pos; pos1++) {
                        if (wordPosition[pos1] - wordPosition[pos]<-3) {
                            isNeedToPass = true; break;
                        }
                    }
                }

                // 포지션을 순서대로 정렬했는데
                // 순서가 달라진다면 글자가 섞여있는 것으로 간주합니다.
                let sortedPosition = tempSoftSearchWordPositions.slice().sort((a, b) => a - b)
                if( !Utils.objectEqual(sortedPosition, tempSoftSearchWordPositions) ){
                    isShuffled = true
                    tempSoftSearchWordPositions = sortedPosition
                }


                // TODO
                // 발견된 각 문자 사이의 거리 및
                // 사람이 인식할 가능성 거리의 계산
                // (3글자가 각각 떨어져 있을 수도 있음)
                // 글자간 사이들을 순회하여서
                // 해당 비속어가 사람이 인식하지 못할 정도로
                // 퍼져있다거나 섞여있는지를 확인합니다.

                // positionInterval - 숫자 포지션 구간을 표시함.
                let positionInterval = Utils.grabCouple(tempSoftSearchWordPositions)
                let collectionTempQList = {}; // 사이 번호 삽입용

                for(let diffRangeIndex in positionInterval){

                    // 글자간 사이에 있는 모든 글자를 순회합니다.
                    let diff = ''
                    let tempCnt = numberOfQs[diffRangeIndex]
                    let tempQList = []; // ?에 해당하는 문자의 위치 찾기

                    for(let diffi = positionInterval[diffRangeIndex][0]+1; diffi <= (positionInterval[diffRangeIndex][1]-1); diffi++){

                        if (tempCnt>0) {
                            if (/[가-힣]/.test(newMessage[diffi])) {tempCnt--; tempQList.push(diffi);}
                            else if (newMessage[diffi]=== " ") {tempCnt = 0; diffi +=newMessage[diffi];}
                            else diff += newMessage[diffi]
                        }
                        else {
                            diff += newMessage[diffi]
                        }

                    }

                    if(isShuffled && !isNeedToPass){
                        // 뒤집힌 단어의 경우엔 자음과 모음이
                        // 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.
                        if(!this.shuffledMessageFilter(diff, false, true))
                            isNeedToPass = true
                    }
                    else {
                        // 순서가 뒤집히지 않았을 때는 한글의 길이가 충분히 길거나 정상단어가 글자 사이에 쓰인 경우 비속어에서 배제합니다.
                        if (this.shuffledMessageFilter(diff,true, true)>3) isNeedToPass = true;
                        else {
                            for (let index in normalWords) {
                                if (diff.length === 0) break
                                let diffSearchedPositions = Utils.getPositionAll(diff, normalWords[index])
                                if (diffSearchedPositions.length > 1) {
                                    isNeedToPass = true;
                                }
                            }
                        }
                    }
                    collectionTempQList[diffRangeIndex] = tempQList

                }

                // 기존에 발견돤 단어와 낱자가 겹쳐도 pass.
                for (let usedSoftSearchWordPositions of softSearchWordPositions) {

                    if (!Utils.isDisjoint(usedSoftSearchWordPositions, tempSoftSearchWordPositions) ) {
                        isNeedToPass = true; break;
                    }
                }

                // 이제 낱자가 안 겹치면 tempBadWordPosition을 확장해서 잡아보자.
                for (let ind =0; ind<wordPosition.length-1; ind++) {
                    if ( collectionTempQList[ (wordPosition.length-1-ind).toString() ] && collectionTempQList[ (wordPosition.length-1-ind).toString() ].length>0) {
                        // 인덱스 꼬이는 일이 안 생기게 뒤에서부터 추가해보자.
                        tempSoftSearchWordPositions.splice( (wordPosition.length-1-ind), 0, collectionTempQList[ (wordPosition.length-1-ind).toString() ] )
                    }
                }

                // 해당 저속한 표현을 발견은 하였지만,
                // 사람이 인지하지 못할 것으로 간주되는 경우
                // 해당 발견된 저속한 표현을 무시합니다.
                if(isNeedToPass) continue

                // 중복 비속어 체크하기.
                var tmpTF = true;
                for (let positions of foundSoftSearchWordPositions) {
                    // 다른 비속어와 포지션이 일치할 때 강제 종료
                    for (let softSearchPosition of positions) {
                        if (Utils.objectInclude(tempSoftSearchWordPositions, softSearchPosition)) {
                            tmpTF =false; break;
                        }
                    }
                }


                // 만약 중첩 테스트 통과되면 softSearchWordPosition에 추가
                if (tmpTF) {
                    let tempSoftSearchWordOriginalPositions = [];
                    softSearchWordPositions.push(tempSoftSearchWordPositions);

                    if (isMap) {

                        for (var pos of tempSoftSearchWordPositions) {

                            // 갯수 세기. isReassemble일 때에는 한글 낱자의 갯수만 센다.
                            let originalCount = originalMessageList[Number(pos)].length;
                            if (isReassemble) {
                                originalCount = originalMessageList[Number(pos)].split("").filter(x=>/[가-힣]/.test(x)).length
                            }
                            for (var k =0; k <originalCount; k++) {

                                    tempSoftSearchWordOriginalPositions.push(originalMessageSyllablePositions[pos] + k);
                            }
                        }
                        // 원문 찾기
                        let originalSoftSearchWord = "";
                        for (var l of tempSoftSearchWordOriginalPositions) {
                            originalSoftSearchWord +=originalMessage[l];
                        }

                        // 나쁜단어 위치 삽입, 원운 위치,

                        softSearchWordOriginalPositions.push(tempSoftSearchWordOriginalPositions);
                        originalSoftSearchWords.push(originalSoftSearchWord);

                    }

                }


            }
            if (softSearchWordPositions.length>0) {

                if (isMap) {
                    // isReassemble 옵션은 dropDouble에서 받침을 뒷 글자에 강제로 붙이는 경우에 대비해서 조합해준다.
                    console.log(`원문: ${originalMessage}`);
                    console.log(`변환된 문장: ${newMessage}`);
                    console.log(`발견된 저속한 표현: [${softSearchWord.join()}]`)
                    console.log(`발견된 저속한 표현 원문: [${originalSoftSearchWords}]`)
                    console.log(`발견된 저속한 표현 위치: [${softSearchWordPositions}]`)
                    console.log(`발견된 저속한 표현 원래 위치: [${softSearchWordOriginalPositions}]`)
                    console.log('\n')
                    foundSoftSearchWords.push(softSearchWord.join(''))
                    foundSoftSearchWordPositions.push(softSearchWordPositions)
                    foundSoftSearchOriginalWords.push(originalSoftSearchWords);
                    foundSoftSearchWordOriginalPositions.push(softSearchWordOriginalPositions);
                }
                else {
                    console.log(`원문: ${newMessage}`)
                    console.log(`발견된 저속한 표현: [${softSearchWord.join()}]`)
                    console.log(`발견된 저속한 표현 위치: [${softSearchWordPositions}]`)
                    console.log('\n')
                    foundSoftSearchWords.push(softSearchWord.join(''))
                    foundSoftSearchWordPositions.push(softSearchWordPositions)
                }

            }


            // 반복 줄이기 위해 강제 탈출.
            if (needMultipleCheck === false && foundSoftSearchWords.length>0) break;

        }

        // type에 따라 리스트 변경
        let typeofBadWordsList = []
        switch(type) {
            case "drug":
                typeofBadWordsList = parsedDrugWords
                break;
            case "insult":
                typeofBadWordsList = parsedInsultWords
                break;
            case "sexuality":
                typeofBadWordsList = parsedSexualityWords
            case "violence":
                typeofBadWordsList = parsedViolenceWords
            default:
                typeofBadWordsList = parsedBadWords
        }

        // 비속어 단어를 한 단어씩 순회합니다.

        for (let badWord of typeofBadWordsList) {



            // 단순히 찾는 것으로 정보를 수집하는 것이 아닌 위치를 아예 수집해보자.
            // findCount 형태 : {시: [1,8], 발:[2,7,12]}등
            let findCount = {}
            // 나쁜 단어 수집 형태. 이 경우는 [[1,2], [8,7]]로 수집된다.
            let badWordPositions = []
            // 별 갯수 관련
            let parserLength = 0;

            let isSkip = false;
            // 이미 더 긴 단어에서 욕설을 찾았다면 그냥 넘어가보자.
            for (let alreadyFound of foundBadWords) {
                // console.log(badWord, alreadyFound.split(""))
                if (Utils.objectInclude(badWord, alreadyFound.split(""))) {

                    isSkip = true; break;
                }
            }

            if(isSkip) continue;

            // 비속어 단어를 한글자씩
            // 순회하며 존재여부를 검사합니다.
            for (let character of badWord) {

                let mainCharacter = character[0]
                let parserCharacter = character[1] // ! 또는 ?

                parserLength = (parserCharacter === "!" || parserCharacter === "+") ? character.length -2 : character.length-1; // ? 개수 추정.

                // 뒤의 낱자 수집
                let nextCharacter = (parserLength===0 && badWord.indexOf(character)<badWord.length-1)
                    ? badWord[ badWord.indexOf(character)+1 ][0].toLowerCase(): "" // 뒤의 낱자 수집.

                let badOneCharacter = String(mainCharacter).toLowerCase();

                // 일단 비속어 단어의 리스트를 정의해서 수집한다.
                findCount[badOneCharacter] = []
                findCount[badOneCharacter+"?"] = parserLength;

                // 비속어 단어의 글자위치를 수집합니다.

                // 메시지 글자를 모두 반복합니다.
                for (let index in newMessage) {

                    // 정상적인 단어의 글자일경우 검사하지 않습니다.
                    if (Utils.objectIn(index, normalWordPositions)) continue

                    // 단어 한글자라도 들어가 있으면
                    // 찾은 글자를 기록합니다.
                    let unsafeOneCharacter = String(newMessage[index]).toLowerCase()

                    if (parserCharacter==="!") {
                        // isKindChar 함수 활용

                        if (this.isKindChar(unsafeOneCharacter, badOneCharacter, nextCharacter)) {
                            findCount[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }

                    }
                    else if (parserCharacter === "+") {
                        if ( Utils.objectInclude( Hangul.disassemble(badOneCharacter), Hangul.disassemble(unsafeOneCharacter), true) ) {
                            findCount[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }
                    else {
                        if (badOneCharacter === unsafeOneCharacter) {
                            findCount[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }

                }
            }


            // 이제 badWord를 찾아보자. 어떻게? findCount에서...

            // let countLetter = []
            // for (let letter in findCount) {
            //     countLetter.push(findCount[letter].length);
            // }
            // // 비속어를 구성하는 단어글자 중 최소 글자 갯수
            // let minCount = Math.min(...countLetter)

            // 단어 포지션 리스트
            let positionsList = Utils.filterList(Object.values(findCount), "object");
            // 단어 뒤의 ? 갯수
            let numberOfQs = Utils.filterList(Object.values(findCount), "number")
            // 낱자 포지션 맵
            let possibleWordPositions = Utils.productList(positionsList);

            // badWord의 원래 포지션 찾기
            let badWordOriginalPositions = [];
            let originalBadWords = [];
            // let tempBadWordPositions = []; // 임시 Bad Word Position. 여기에 대해서 수행한다
            //


            // j개수만큼 반복하기
            for (let wordPosition of possibleWordPositions) {

                // console.log('wordPosition', wordPosition)
                // 단어 첫글자의 위치 잡기

                let tempBadWordPositions = [...wordPosition];

                // 넘어갈 필요가 있는지 확인해보기
                let isNeedToPass = false;
                // 순서가 바뀌었는지도 체크해보자.
                let isShuffled = false

                // 포지션 체크. 단어에서 뒤에 올 글자가 앞에 올 글자보다 3글자 이상 앞에 오면 isNeedToPass를 띄운다.
                for (var pos =0; pos<wordPosition.length; pos++) {
                    for (var pos1 =0; pos1<pos; pos1++) {
                        if (wordPosition[pos1] - wordPosition[pos]<-3) {
                            isNeedToPass = true; break;
                        }
                    }
                }

                // 포지션을 순서대로 정렬했는데
                // 순서가 달라진다면 글자가 섞여있는 것으로 간주합니다.
                let sortedPosition = tempBadWordPositions.slice().sort((a, b) => a - b)
                if( !Utils.objectEqual(sortedPosition, tempBadWordPositions) ){
                    isShuffled = true
                    tempBadWordPositions = sortedPosition
                }

                // TODO
                // 발견된 각 문자 사이의 거리 및
                // 사람이 인식할 가능성 거리의 계산

                // (3글자가 각각 떨어져 있을 수도 있음)


                // 글자간 사이들을 순회하여서
                // 해당 비속어가 사람이 인식하지 못할 정도로
                // 퍼져있다거나 섞여있는지를 확인합니다.

                let positionInterval = Utils.grabCouple(tempBadWordPositions);
                let collectionTempQList = {}; // 사이 번호 삽입용

                for(let diffRangeIndex in positionInterval){

                    let tempCnt = numberOfQs[diffRangeIndex];
                    let tempQList = []; // ?에 해당하는 문자의 위치 찾기.

                    // 글자간 사이에 있는 모든 글자를 순회합니다.
                    let diff = ''
                    for(let diffi = positionInterval[diffRangeIndex][0]+1; diffi <= (positionInterval[diffRangeIndex][1]-1); diffi++){
                        if (tempCnt>0) {
                            if (/[가-힣]/.test(newMessage[diffi])) {tempCnt--; tempQList.push(diffi);}
                            else if (newMessage[diffi]=== " ") {tempCnt = 0; diffi +=newMessage[diffi];}
                            else diff += newMessage[diffi]
                        }
                        else {
                            diff += newMessage[diffi]
                        }
                    }

                    if(isShuffled && !isNeedToPass){
                        // 뒤집힌 단어의 경우엔 자음과 모음이
                        // 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.
                        if(!this.shuffledMessageFilter(diff, false, true))
                            isNeedToPass = true
                    }
                    else {
                        // 순서가 뒤집히지 않았을 때는 한글의 길이가 충분히 길거나 정상단어가 글자 사이에 쓰인 경우 비속어에서 배제합니다.
                        if (this.shuffledMessageFilter(diff,true, true)>3) isNeedToPass = true;
                        else {
                            for (let index in normalWords) {
                                if (diff.length === 0) break
                                let diffSearchedPositions = Utils.getPositionAll(diff, normalWords[index])
                                if (diffSearchedPositions.length > 1) {
                                    isNeedToPass = true;
                                }
                            }
                        }
                    }
                    collectionTempQList[diffRangeIndex] = tempQList

                }
                // if (Object.keys(collectionTempQList).length !==0 ) console.log(collectionTempQList);

                // 기존에 발견돤 단어와 낱자가 겹쳐도 pass
                for (let usedBadWordPositions of badWordPositions) {
                    if (!Utils.isDisjoint(usedBadWordPositions, tempBadWordPositions) ) {
                        isNeedToPass = true; break;
                    }
                }

                // 이제 낱자가 안 겹치면 tempBadWordPosition을 확장해서 잡아보자.
                for (let ind =0; ind<wordPosition.length-1; ind++) {
                    if ( collectionTempQList[ (wordPosition.length-1-ind).toString() ] && collectionTempQList[ (wordPosition.length-1-ind).toString() ].length>0) {
                        // 인덱스 꼬이는 일이 안 생기게 뒤에서부터 추가해보자.
                        tempBadWordPositions.splice( (wordPosition.length-1-ind), 0, collectionTempQList[ (wordPosition.length-1-ind).toString() ] )
                    }
                }

                // 해당 비속어를 발견은 하였지만,
                // 사람이 인지하지 못할 것으로 간주되는 경우
                // 해당 발견된 비속어를 무시합니다.
                if(isNeedToPass) continue

                // 중복 비속어 체크하기.
                var tmpTF = true;
                for (let positions of foundBadWordPositions) {
                    // 다른 비속어와 포지션이 일치할 때 강제 종료
                    for (let badPosition of positions) {
                        if (Utils.objectInclude(tempBadWordPositions, badPosition)) {
                            tmpTF =false; break;
                        }
                    }
                }

                // 저속한 표현과 중복되는지 확인해보자.
                for (let positions of foundSoftSearchWordPositions) {

                    for (let softSearchPosition of positions) {

                        // 또 저속한 표현과 포지션이 일치할 때는 거짓으로
                        if (Utils.objectEqual(tempBadWordPositions, softSearchPosition)) {
                            // console.log('포지션 중복 확인')
                            tmpTF =false;
                        }
                        // posix 최댓값이나 최솟값이 비속어 표현 사이에 끼어버린 경우 - 아예 비속어로 ) )합치기

                        // if (Math.min(...tempBadWordPositions) <= Math.min(...softSearchPosition) &&  Math.min(...softSearchPosition)  <= Math.max(...tempBadWordPositions) ) {
                        //     tmpTF = true;
                        //     badWord = Utils.removeMultiple([...badWord, ...foundSoftSearchWords[foundSoftSearchWordPositions.indexOf(positions)] ])
                        //     tempBadWordPositions = Utils.removeMultiple([...tempBadWordPositions, ...softSearchPosition])
                        // }
                        // else if (Math.min(...tempBadWordPositions) <= Math.max(...softSearchPosition) && Math.max(...softSearchPosition)  <= Math.max(...tempBadWordPositions) ) {
                        //     tmpTF = true;
                        //     badWord = Utils.removeMultiple([...foundSoftSearchWords[foundSoftSearchWordPositions.indexOf(positions)], ...badWord]);
                        //     badWordPositions = Utils.removeMultiple([...softSearchPosition, ...tempBadWordPositions ]);
                        // }
                        // // 만약 비속어와 저속한 표현 사이에 숫자, 알파벳, 공백밖에 없으면 비속어로 합치기
                        // else if  ( Math.max(...tempBadWordPositions) < Math.min(...softSearchPosition ) ) {
                        //     let inter0 = Math.max(...tempBadWordPositions);
                        //     let inter1 = Math.min(...softSearchPosition);
                        //     if (newMessage.slice(inter0 + 1, inter1).match(/^[0-9A-Za-z\s~!@#$%^&*()_\-+\\|\[\]{};:'"<,>.?/]*$/ )) {
                        //         tmpTF = true;
                        //         badWord = [...badWord, ...foundSoftSearchWords[foundSoftSearchWordPositions.indexOf(positions)]];
                        //         tempBadWordPositions = [...tempBadWordPositions, ...softSearchPosition];
                        //     }
                        // }
                        // else if  ( Math.max(...softSearchPosition) < Math.min(...tempBadWordPositions) ) {
                        //     let inter0 = Math.max(...softSearchPosition);
                        //     let inter1 = Math.min(...tempBadWordPositions);
                        //     if (newMessage.slice(inter0+1, inter1).match(/^[0-9A-Za-z\s~!@#$%^&*()_\-+\\|\[\]{};:'"<,>.?/]*$/) ) {
                        //         tmpTF = true;
                        //         badWord = [...foundSoftSearchWords[foundSoftSearchWordPositions.indexOf(positions)], ...badWord];
                        //         tempBadWordPositions = [...softSearchPosition, ...tempBadWordPositions];
                        //     }
                        // }

                    }

                }

                // 만약 중첩 테스트 통과되면 badWordPosition에 추가
                if (tmpTF) {
                    let tempBadWordOriginalPositions = [];

                    // 나쁜단어 위치 삽입, 원운 위치,
                    badWordPositions.push(tempBadWordPositions);
                    // map일 때는 메시지 더 찾기
                    if (isMap) {

                        for (var pos of tempBadWordPositions) {
                            // 갯수 세기. isReassemble일 때에는 한글 낱자의 갯수만 센다.
                            let originalCount = originalMessageList[Number(pos)].length;
                            if (isReassemble) {
                                originalCount = originalMessageList[Number(pos)].split("").filter(x=>/[가-힣]/.test(x)).length
                            }

                            for (var k =0; k <originalCount; k++) {
                                tempBadWordOriginalPositions.push( originalMessageSyllablePositions[pos] + k);
                            }
                        }
                        // 원문 찾기
                        let originalBadWord = "";
                        for (var k of tempBadWordOriginalPositions) {
                            originalBadWord +=originalMessage[k];
                        }
                        badWordOriginalPositions.push(tempBadWordOriginalPositions);
                        originalBadWords.push(originalBadWord);

                    }

                }

            }

            if (badWordPositions.length>0) {

                if (isMap) {
                    console.log(`원문: ${originalMessage}`);
                    console.log(`변환된 문장: ${newMessage}`);
                    console.log(`발견된 비속어: [${badWord.join()}]`)
                    console.log(`발견된 비속어 원문: [${originalBadWords}]`)
                    console.log(`발견된 비속어 위치: [${badWordPositions}]`)
                    console.log(`발견된 비속어 원래 위치: [${badWordOriginalPositions}]`)
                    console.log('\n')
                    foundBadWords.push(badWord.join(''))
                    foundBadWordPositions.push(badWordPositions)
                    foundBadOriginalWords.push(originalBadWords);
                    foundBadWordOriginalPositions.push(badWordOriginalPositions);
                }
                else {
                    console.log(`원문: ${newMessage}`)
                    console.log(`발견된 비속어: [${badWord.join()}]`)
                    console.log(`발견된 비속어 위치: [${badWordPositions}]`)
                    console.log('\n')
                    foundBadWords.push(badWord.join(''))
                    foundBadWordPositions.push(badWordPositions)
                }

            }
            // 반복 줄이기 위해 강제 탈출.
            if (needMultipleCheck === false && foundBadWords.length>0) break;
        }

        //부적절하게 겹받침 많이 사용했는지 여부 확인하기

        let tooMuchDouble ={val:false, pos:[], txt:[]};

        tooMuchDouble = {
                val: tooMuchDouble.val || Utils.tooMuchDoubleEnd(newMessage).val,
                pos: [...tooMuchDouble.pos, ...Utils.tooMuchDoubleEnd(newMessage).pos],
                txt: [...tooMuchDouble.txt, ...Utils.tooMuchDoubleEnd(newMessage).txt]
            }


            let isMapAdded = {};
            if (isMap) {
                isMapAdded = {
                    originalFound: needMultipleCheck ? foundBadOriginalWords : foundBadOriginalWords.slice(0).slice(0),
                    originalPositions: needMultipleCheck ? foundBadWordOriginalPositions : foundBadWordOriginalPositions.slice(0).slice(0),
                    originalSoftSearchFound : needMultipleCheck ? foundSoftSearchOriginalWords : foundSoftSearchOriginalWords.slice(0).slice(0),
                    originalSoftSearchPositions : needMultipleCheck ? foundSoftSearchWordOriginalPositions : foundSoftSearchWordOriginalPositions.slice(0).slice(0)
                };
            }

        // 결과 출력
        return {
            found: needMultipleCheck? foundBadWords : foundBadWords.slice(0),
            positions: needMultipleCheck? foundBadWordPositions : foundBadWordPositions.slice(0).slice(0),
            softSearchFound: needMultipleCheck? foundSoftSearchWords: foundSoftSearchWords.slice(0),
            softSearchPositions: needMultipleCheck? foundSoftSearchWordPositions : foundSoftSearchWordPositions.slice(0).slice(0),
            //부적절하게 겹자음 받침을 많이 사용한 단어 적발.
            tooMuchDoubleEnd: tooMuchDouble,
            ...isMapAdded
        }
    }

    // 비속어 리스트가 주어졌을 때 비속어 리스트 안에서 검사하기.
    // 옵션 추가 - parsedWordList 대신 wordList를 입력해도 자동으로 parsedWordList로 변환해서 처리 가능.
    static nativeFindFromList(message, parsedWordsList, needMultipleCheck=false, isMap=false, isReassemble=false) {

        // check whether wordList is parsed or not
        if (typeof parsedWordsList[0] === "string" ) {
            parsedWordsList = this.parseFromList(parsedWordsList)
        }

        // let normalWordPositions = {}
        let foundBadWords = []
        let foundBadOriginalWords = []
        let foundBadWordPositions = []
        let foundBadWordOriginalPositions = []; // isMap에서 original 단어 위치
        let originalMessageList = [];
        let originalMessageSyllablePositions = []; // 원래 음가 위치

        // Map으로 주어지면 newMessage에 대해 찾는다.
        let originalMessage = "";
        let newMessage ="";
        if (isMap) {
            // 맵을 파싱해서 찾아보자.
            originalMessageList = Utils.parseMap(message).messageList;
            // console.log(message);
            originalMessage = originalMessageList.join("");
            // dropDouble일 때에는 바ㅂ오 ->밥오로 환원하기 위해 originalMessage를 한글 조합으로
            originalMessage = isReassemble ? Hangul.assemble(Hangul.disassemble(originalMessage)): originalMessage;
            originalMessageSyllablePositions =  Utils.parseMap(message).messageIndex;
            newMessage = Utils.parseMap(message).parsedMessage.join("");
        }
        else {
            newMessage = message;
        }

        // 정상단어의 포지션을 찾습니다.
        // 형식 : [1,2,3,...]
        let normalWordPositions = this.findNormalWordPositions(newMessage, false)

        // 정상단어의 포지션을 찾습니다.
        // for (let index in normalWords) {
        //     if (newMessage.length == 0) break
        //     let searchedPositions = Utils.getPositionAll(newMessage, normalWords[index])
        //     for(let searchedPosition of searchedPositions)
        //         if(searchedPosition !== -1)
        //             normalWordPositions[searchedPosition] = true
        // }
        // normalWordPositions 형식
        // {정상단어 포지션 번호:true} 형식.

        // 주어진 파싱된 비속어 리스트에서 한 단어식 순회합니다.
        for (let badWord of parsedWordsList) {

            // 단순히 찾는 것으로 정보를 수집하는 것이 아닌 위치를 아예 수집해보자.
            // findCount 형태 : {바: [1,8], 보:[2,7,12]}등
            let findCount = {}
            // 저속한 단어 수집 형태. 이 경우는 [[1,2], [8,7]]로 수집된다.
            let badWordPositions = []
            // 별 갯수 세기
            let parserLength = 0;

            let isSkip = false;
            // 이미 더 긴 단어에서 욕설을 찾았다면 그냥 넘어가보자.
            for (let alreadyFound of foundBadWords) {
                if (Utils.objectInclude(badWord, alreadyFound.split(""))) {
                    isSkip = true; break;
                }
            }

            if(isSkip) continue;


            // 저속한 단어들을 한 단어씩
            // 순회하며 존재여부를 검사합니다.
            for (let character of badWord) {

                let mainCharacter = character[0]
                let parserCharacter = character[1] // !, ?, + 또는 undefined
                parserLength =  (parserCharacter==="!" || parserCharacter === "+") ? character.length-2 : character.length-1
                let badOneCharacter = String(mainCharacter).toLowerCase();
                // 뒤의 낱자 수집
                let nextCharacter = (parserLength===0 && badWord.indexOf(character)<badWord.length-1)
                    ? badWord[ badWord.indexOf(character)+1 ][0].toLowerCase(): "" // 뒤의 낱자 수집.

                // 일단 저속한 단어의 리스트를 정의해서 수집한다.
                findCount[badOneCharacter] = []
                findCount[badOneCharacter+"?"] = parserLength

                // 저속한 단어의 글자위치를 수집합니다.

                // 메시지 글자를 모두 반복합니다.
                for (let index in newMessage) {

                    // 정상적인 단어의 글자일경우 검사하지 않습니다.
                    // 적발된 단어가 모두 정상포지션에 자리잡힌 경우 잡지 않는다.
                    if (Utils.objectIn(index, normalWordPositions)) continue

                    // 단어 한글자라도 들어가 있으면
                    // 찾은 글자를 기록합니다.
                    let unsafeOneCharacter = String(newMessage[index]).toLowerCase()
                    if (parserCharacter==="!") {
                        // isKindChar 함수 활용
                        if (this.isKindChar(unsafeOneCharacter, badOneCharacter, nextCharacter)) {
                            findCount[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }
                    else if (parserCharacter === "+") {
                        if ( Utils.objectInclude( Hangul.disassemble(badOneCharacter), Hangul.disassemble(unsafeOneCharacter), true) ) {
                            findCount[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }
                    else {
                        if (badOneCharacter === unsafeOneCharacter) {
                            findCount[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }

                }
            }


            // 단어 포지션 리스트
            let positionsList = Utils.filterList(Object.values(findCount), "object");
            // 단어 뒤의 ? 갯수
            let numberOfQs = Utils.filterList(Object.values(findCount), "number")
            // 낱자 포지션 맵
            let possibleWordPositions = Utils.productList(positionsList);

            // badWord의 원래 포지션 찾기
            let badWordOriginalPositions = [];
            let originalBadWords = [];


            // 단어 포지션 리스트에서 for문을 돌려보자.
            for (let wordPosition of possibleWordPositions) {

                let tempBadWordPositions = [...wordPosition];

                // 넘어갈 필요가 있는지 확인해보기
                let isNeedToPass = false
                // 순서가 바뀌었는지도 체크해보자.
                let isShuffled = false

                // 포지션 체크. 단어에서 뒤에 올 글자가 앞에 올 글자보다 3글자 이상 앞에 오면 isNeedToPass를 띄운다.
                for (var pos =0; pos<wordPosition.length; pos++) {
                    for (var pos1 =0; pos1<pos; pos1++) {
                        if (wordPosition[pos1] - wordPosition[pos]<-3) {
                            isNeedToPass = true; break;
                        }
                    }
                }

                // 포지션을 순서대로 정렬했는데
                // 순서가 달라진다면 글자가 섞여있는 것으로 간주합니다.
                let sortedPosition = tempBadWordPositions.slice().sort((a, b) => a - b)
                if( !Utils.objectEqual(sortedPosition, tempBadWordPositions) ){
                    isShuffled = true
                    tempBadWordPositions = sortedPosition
                }


                // TODO
                // 발견된 각 문자 사이의 거리 및
                // 사람이 인식할 가능성 거리의 계산
                // (3글자가 각각 떨어져 있을 수도 있음)
                // 글자간 사이들을 순회하여서
                // 해당 비속어가 사람이 인식하지 못할 정도로
                // 퍼져있다거나 섞여있는지를 확인합니다.
                let positionInterval = Utils.grabCouple(tempBadWordPositions)
                let collectionTempQList = {}; // 사이 번호 삽입용.

                for(let diffRangeIndex in positionInterval){

                    let tempCnt = numberOfQs[diffRangeIndex]
                    let tempQList = []; // ?에 해당하는 문자의 위치 찾기.

                    // 글자간 사이에 있는 모든 글자를 순회합니다.
                    let diff = ''
                    for(let diffi =positionInterval[diffRangeIndex][0]+1; diffi <= (positionInterval[diffRangeIndex][1]-1); diffi++){
                        if (tempCnt>0 && /[가-힣]/.test(newMessage[diffi])) {tempCnt--; tempQlist.push(diffi);}
                        else if (newMessage[diffi]=== " ") {tempCnt = 0; diffi +=newMessage[diffi];}
                        else diff += newMessage[diffi];
                    }

                    if(isShuffled && !isNeedToPass){
                        // 뒤집힌 단어의 경우엔 자음과 모음이
                        // 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.
                        if(!this.shuffledMessageFilter(diff, false, true))
                            isNeedToPass = true
                    }
                    else {
                        // 순서가 뒤집히지 않았을 때는 한글의 길이가 충분히 길거나 정상단어가 글자 사이에 쓰인 경우 비속어에서 배제합니다.
                        if (this.shuffledMessageFilter(diff,true, true)>3) isNeedToPass = true;
                        else {
                            for (let index in normalWords) {
                                if (diff.length === 0) break
                                let diffSearchedPositions = Utils.getPositionAll(diff, normalWords[index])
                                if (diffSearchedPositions.length > 1) {
                                    isNeedToPass = true;
                                }
                            }
                        }
                    }

                    collectionTempQList[diffRangeIndex] = tempQList
                }



                // 기존에 발견돤 단어와 낱자가 겹쳐면 pass
                for (let usedBadWordPositions of badWordPositions) {
                    if ( !Utils.isDisjoint(usedBadWordPositions, tempBadWordPositions) ) {
                        isNeedToPass = true; break;
                    }
                }

                // 이제 낱자가 안 겹치면 tempBadWordPosition을 확장해서 잡아보자.
                for (let ind =0; ind<wordPosition.length-1; ind++) {
                    if ( collectionTempQList[ (wordPosition.length-1-ind).toString() ] && collectionTempQList[ (wordPosition.length-1-ind).toString() ].length>0) {
                        // 인덱스 꼬이는 일이 안 생기게 뒤에서부터 추가해보자.
                        tempBadWordPositions.splice( (wordPosition.length-1-ind), 0, collectionTempQList[ (wordPosition.length-1-ind).toString() ] )
                    }
                }



                // 해당 저속한 표현을 발견은 하였지만,
                // 사람이 인지하지 못할 것으로 간주되는 경우
                // 해당 발견된 비속어를 무시합니다.
                if(isNeedToPass) continue

                // 중복 비속어 체크하기.
                var tmpTF = true;
                for (let positions of foundBadWordPositions) {
                    // 다른 비속어와 포지션이 일치할 때 강제 종료
                    for (let badPosition of positions) {
                        if (Utils.objectInclude(tempBadWordPositions, badPosition)) {
                            tmpTF =false; break;
                        }
                    }
                }


                // 만약 중첩 테스트 통과되면 badWordPosition에 추가
                if (tmpTF) {
                    let tempBadWordOriginalPositions = [];
                    badWordPositions.push(tempBadWordPositions);

                    if (isMap) {

                        // 갯수 세기. isReassemble일 때에는 한글 낱자의 갯수만 센다.
                        let originalCount = originalMessageList[Number(pos)].length;
                        if (isReassemble) {
                            originalCount = originalMessageList[Number(pos)].split("").filter(x=>/[가-힣]/.test(x)).length
                        }

                        for (var pos of tempBadWordPositions) {
                            for (var k =0; k <originalCount; k++) {

                                tempBadWordOriginalPositions.push(originalMessageSyllablePositions[pos] + k);
                            }
                        }
                        // 원문 찾기
                        let originalBadWord = "";
                        for (var l of tempBadWordOriginalPositions) {
                            originalBadWord +=originalMessage[l];
                        }

                        // 나쁜단어 위치 삽입, 원운 위치,

                        badWordOriginalPositions.push(tempBadWordOriginalPositions);
                        originalBadWords.push(originalBadWord);

                    }

                }


            }
            if (badWordPositions.length>0) {

                if (isMap) {
                    // isReassemble 옵션은 dropDouble에서 받침을 뒷 글자에 강제로 붙이는 경우에 대비해서 조합해준다.
                    console.log(`원문: ${originalMessage}`);
                    console.log(`변환된 문장: ${newMessage}`);
                    console.log(`발견된 비속어: [${badWord.join()}]`)
                    console.log(`발견된 비속어 원문: [${originalBadWords}]`)
                    console.log(`발견된 비속어 위치: [${badWordPositions}]`)
                    console.log(`발견된 비속어 원래 위치: [${badWordOriginalPositions}]`)
                    console.log('\n')
                    foundBadWords.push(badWord.join(''))
                    foundBadWordPositions.push(badWordPositions)
                    foundBadOriginalWords.push(originalBadWords);
                    foundBadWordOriginalPositions.push(badWordOriginalPositions);
                }
                else {
                    console.log(`원문: ${newMessage}`)
                    console.log(`발견된 비속어: [${badWord.join()}]`)
                    console.log(`발견된 비속어 위치: [${badWordPositions}]`)
                    console.log('\n')
                    foundBadWords.push(badWord.join(''))
                    foundBadWordPositions.push(badWordPositions)
                }

            }


            // 반복 줄이기 위해 강제 탈출.
            if (needMultipleCheck === false && foundBadWords.length>0) break;

        }

        let isMapAdded = {};
        if (isMap) {
            isMapAdded = {
                originalFound: needMultipleCheck ? foundBadOriginalWords : foundBadOriginalWords.slice(0).slice(0),
                originalPositions: needMultipleCheck ? foundBadWordOriginalPositions : foundBadWordOriginalPositions.slice(0).slice(0),
            };
        }

        // 결과 출력
        return {
            found: needMultipleCheck? foundBadWords : foundBadWords.slice(0),
            positions: needMultipleCheck? foundBadWordPositions : foundBadWordPositions.slice(0).slice(0),
            ...isMapAdded
        }

    }

    // 비속어를 결자처리하는 함수
    static fix(message, replaceCharacter, condition= {qwertyToDubeol:false, antispoof:false, dropDouble:false, fixSoft:false, isOriginal:false}) {

        let fixedMessage = "";
        let fixedMessageList = [];
        let fixedMessageIndex = []
        let fixedMessageObject = {}
        // condition
        if (condition.qwertyToDubeol === true) {
            fixedMessageObject = this.nativeFind(Utils.qwertyToDubeol(message, true), true, true)
            fixedMessageList = condition.isOriginal ? Utils.parseMap(Utils.qwertyToDubeol(message, true)).messageList : Utils.parseMap(Utils.qwertyToDubeol(message, true)).parsedMessage
            fixedMessageIndex = Utils.parseMap(Utils.qwertyToDubeol(message, true)).messageIndex;
            // fixedMessage = fixedMessageList.join("")
        }
        else if (condition.dropDouble=== true) {
            fixedMessageObject = this.nativeFind(Utils.dropDouble(message, true), true, true, true)
            fixedMessageList = condition.isOriginal? Utils.parseMap(Utils.dropDouble(message, true)).messageList:Utils.parseMap(Utils.dropDouble(message, true)).parsedMessage
            fixedMessageIndex = Utils.parseMap(Utils.dropDouble(message, true)).messageIndex;
            // fixedMessage = fixedMessageList.join("")
        }
        else if (condition.antispoof === true) {
            fixedMessageObject = this.nativeFind(Utils.antispoof(message, true), true, true)
            fixedMessageList = condition.isOriginal? Utils.parseMap(Utils.antispoof(message, true)).messageList: Utils.parseMap(Utils.antispoof(message, true)).parsedMessage
            fixedMessageIndex = Utils.parseMap(Utils.antispoof(message, true)).messageIndex;
            // fixedMessage = fixedMessageList.join("")
        }
        else {
            fixedMessageObject = this.nativeFind(Utils.msgToMap(message), true, true)
            fixedMessageList = Utils.parseMap(Utils.msgToMap(message)).parsedMessage
        }

        // console.log(fixedMessageObject)
        // console.log(fixedMessageList)

        replaceCharacter = (replaceCharacter === undefined) ? '*' : replaceCharacter

        // 원본 메시지가 아닌 변환된 메시지의 욕설을 숨김자 처리하려고 할 때
        if (!condition.isOriginal) {
            for (let index in fixedMessageList) {
                    for (let positions of fixedMessageObject.positions) {
                        // object에서 position이 발견되는 경우 대체한다.
                        for (let position of positions)
                        {

                            if (position.indexOf(parseInt(index))!==-1) fixedMessageList[index] = replaceCharacter
                        }

                    }
                if (condition.fixSoft) {
                    for (let positions of obj.positions) {
                            // object에서 position이 발견되는 경우 대체한다.
                        for (let position of positions)
                        {
                            if (position.indexOf(parseInt(index))!==-1) fixedMessageList[index] = replaceCharacter
                        }

                    }
                    if (fixedMessageObject.tooMuchDoubleEnd.pos.indexOf(index) !== -1)
                        fixedMessageList[index] = replaceCharacter
                }
            }
        }
        // 원본 메시지의 욕설을 숨김처리하려고 할 때
        else {
            for (let index in fixedMessageList) {
                    for (let positions of fixedMessageObject.positions) {
                        // object에서 position이 발견되는 경우 대체한다.
                        for (let position of positions) {
                            if (position.indexOf(parseInt(index))!==-1) fixedMessageList[index] = replaceCharacter
                        }

                    }
                if (condition.fixSoft) {
                        for (let positions of fixedMessageObject.positions) {
                            // object에서 position이 발견되는 경우 대체한다.
                            for (let position of positions) {

                                if (position.indexOf(parseInt(index))!==-1) fixedMessageList[index] = replaceCharacter
                            }
                        }
                    if (fixedMessageObject.tooMuchDoubleEnd.pos.indexOf(index.toString()) !== -1)
                        fixedMessageList[index] = replaceCharacter
                }
            }
        }

        fixedMessage = fixedMessageList.join("")

        return fixedMessage
    }

    // 메시지에서 정상단어 위치 찾는 맵
    // isMap 형식일 경우 {정상단어: [[정상단어포지션1], [정상단어포지션2],...],... } 형식으로 출력
    // isMap 형식이 아니면 message에서 정상단어의 낱자의 위치 리스트 형식으로 출력.
    // 선택자 ?, !는 일단 무시하는 것으로.
    static findNormalWordPositions (message, isMap = true) {
        let exceptNormalPosition = []

        // 우선 exceptNormalPosition 찾기
        for (let exceptWord of exceptWords) {
            exceptNormalPosition = Utils.listUnion(exceptNormalPosition, Utils.getPositionAll(message, exceptWord))
        }
        // 숫자 정렬하기
        exceptNormalPosition.sort((a,b)=>(a-b))

        let wordPositionMap = {}

        // 정상단어 포지션 찾기
        for (let normalWord of normalWords) {
            let newNormalWord = normalWord.replace("!", "").replace("?", "")
            // console.log("NORMALWORD", newNormalWord)
            let i = message.indexOf(newNormalWord), indexes = []
            let tempList = [] // 저장용.
            while(i !==-1) {
                // 우선 단어 찾기
                indexes.push(i)
                for (var j =1; j<newNormalWord.length; j++) {
                    indexes.push(i+j)
                }
                // 포함되지 않을 때 tempList에 저장
                if (!Utils.objectInclude(indexes, exceptNormalPosition)) {
                    tempList.push(indexes)
                }
                // 인덱스값 초기화후 다시 찾기
                i = message.indexOf(newNormalWord, ++i)
                indexes = []
            }
            // 단어가 들어갔을 때 저장.
            if (tempList.length>0) wordPositionMap[normalWord] = tempList
        }

        // isMap일 때에는 {단어:[[위치1], [위치2],....], ...} 형식으로 출력
        if (isMap) return wordPositionMap;
        else {
            let  resList = []
            for (let lis of Object.values(wordPositionMap) ) {
                resList = Utils.listUnion(resList, Utils.listUnion(lis))
            }
            return resList.sort((a,b)=> (a-b))
        }

    }

    // 어떤 단어가 비속어 목록에 포함된지 체크
    static isExistNormalWord(word) {
        return (typeof(normalWordsMap[word]) != 'undefined')
    }

    // 정상 단어를 목록에 추가. - 배열
    static addNormalWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (word.length == 0) continue

            if (this.isExistNormalWord(word)) continue

            normalWordsMap[word] = true
            normalWords.push(word)
        }
    }

    // 정상단어 삭제
    static deleteNormalWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (!this.isExistNormalWord(word)) continue

            delete(normalWordsMap[word])

            for (let mapIndex = normalWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (normalWords[mapIndex] === word) {
                    normalWords.splice(mapIndex, 1)
                    break
                }
            }
        }
    }

    // 리스트 안에 있는지 판단하눈 함수
    // 예시 : (봡보 => 바!보! True)
    static wordIncludeType(word, comp) {
        let wordDisassemble = Utils.wordToArray(word), compDisassemble = Utils.wordToArray(comp);

        let res = true;
        if (wordDisassemble.length !== compDisassemble.length ) return false;
        else {
            // console.log(compDisassemble)
            for (let ind in compDisassemble) {
                // let wordType = wordDisassemble[ind][1]
                let compType = compDisassemble[ind][1]
                let nextChar = ""
                // console.log(compDisassemble.length, ind)
                if (ind < compDisassemble.length-1) nextChar = compDisassemble[Number(ind)+1].slice(0)[0]
                if (compType!=="!") {
                    if (wordDisassemble[Number(ind)][0] !== compDisassemble[Number(ind)][0]) res =false;
                }
                else {
                    if (! this.isKindChar(wordDisassemble[Number(ind)][0], compDisassemble[Number(ind)][0], nextChar)) res = false;
                }
                if (res === false) {return res;}
            }
            return true;
        }

    }


    // 비속어 여부 파악하기
    static isExistBadWord(word, type="") {
        switch(type) {
            case 'drug':
                for (let inWord of typeofBadWords.drug) {
                    if (this.wordIncludeType(word, inWord)) return true;
                }
                return false;
            case 'insult':
                for (let inWord of typeofBadWords.insult) {
                    if (this.wordIncludeType(word, inWord)) return true;
                }
                return false;
            case 'sexuality':
                for (let inWord of typeofBadWords.sexuality) {
                    if (this.wordIncludeType(word, inWord)) return true;
                }
                return false;
            case 'violence':
                for (let inWord of typeofBadWords.violence) {
                    if (this.wordIncludeType(word, inWord)) return true;
                }
                return false;
            default:
                for (let inWord of Utils.listUnion(typeofBadWords.drug, typeofBadWords.insult, typeofBadWords.sexuality, typeofBadWords.violence, badWords)) {
                    if (this.wordIncludeType(word, inWord)) return true;
                }
                return false;
        }
    }

    // 비속어 추가 -> 리스트 입력시에 리스트 추가
    static addBadWords(words, type) {
        switch(type) {
            case 'drug':
            case "insult":
            case "sexuality":
            case "violencc":
                for (let wordsIndex in Words) {
                    let word = words[wordsIndex]
                    if (word.length ===0 ) continue
                    if (this.isExistBadWord(word, type)) continue
                }

        }
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (word.length == 0) continue

            if (this.isExistBadWord(word)) continue

            badWordsMap[word] = true
            badWords.push(word)
        }
    }

    static deleteBadWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (!this.isExistBadWord(word)) continue

            delete(badWordsMap[word])

            for (let mapIndex = badWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (badWords[mapIndex] === word) {
                    badWords.splice(mapIndex, 1)
                    break
                }
            }
        }
    }

    static isExistSoftSearchWord(word) {
        return (typeof(softSearchWordsMap[word]) != 'undefined')
    }

    static addSoftSearchWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (word.length == 0) continue

            if (this.isExistSoftSearchWord(word)) continue

            softSearchWordsMap[word] = true
            softSearchWords.push(word)
        }
    }

    static deleteSoftSearchWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (!this.isExistSoftSearchWord(word)) continue

            delete(softSearchWordsMap[word])

            for (let mapIndex = softSearchWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (softSearchWords[mapIndex] === word) {
                    softSearchWords.splice(mapIndex, 1)
                    break
                }
            }
        }
    }

    // 뒤집힌 단어의 경우엔 자음과 모음이
    // 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.-
    static shuffledMessageFilter(message, isCount = false, isChar = false) {
        // 우선 값 지정
        let cnt = 0;
        let tempCnt = 0;
        for(let char of message){
            if(Hangul.isComplete(char)) {
                cnt++;
                if (isChar && tempCnt>0) {cnt++; tempCnt = 0;}
            }
            else {
                // 영단어도 숫자도 센다.
                if (isChar) {
                    if (/^[A-Za-z]$/.test(char)) {tempCnt++;}
                    // 공백이 들어가면 단어로 추가
                    else if (char === " ") {cnt++; tempCnt = 0;}
                    // 특정문자는 없는 것처럼 처리함.
                    else if (/^[,\.!\?:;"'&\-()0-9]$/.test(char)) {
                        continue;
                    }
                    // 다른 문자는 그냥 영단어 숫자 초기화.
                    else { tempCnt = 0; }
                }
            }
        }
        return isCount?cnt:(cnt === 0);
    }



    // 유사 낱자 검사. 낱자에 가? 형태로 표현되었을 경우 가뿐 아니라 각, 간 등 다 포함.
    // char : 낱자
    // comp : 낱자. comp!에 char가 포함되는 경우 true, 아닌 경우 false를 반환한다.
    // following : !뒤에 오는 낱자. 없으면 ""
    static  isKindChar(char, comp, following="") {
        // 초성중성종성 분리 데이터 이용하기
        let charDisassemble = Utils.choJungJong(char)
        let compDisassemble = Utils.choJungJong(comp)
        let followDisassemble = following===""?{cho:[], jung:[], jong:[]}:Utils.choJungJong(following)
        let resi = false; // 초성 유사음
        let resm = false; // 중성 유사음
        let rese = false; // 종성 유사음

        // console.log(charDisassemble, compDisassemble, followDisassemble)

        const toothConsonant = Utils.toothConsonant;

        // 유사초성. 가 -> 까, 카
        const simInit = Utils.simInit;

        // 유사중성.  고 -> 거, 교
        const simMiddle = Utils.simMiddle;

        // 초성이 치음일 때 유사중성 for ㄷ,ㄸ,ㅅ,ㅆ,ㅈ,ㅊ,ㅉ,ㅌ 이 경우는 y복모음 구별불가인 특수 케이스
        const toothSimMiddle =  Utils.toothSimMiddle;
        // 유사종성
        const simEnd = Utils.simEnd;

        // 뒷글자에 의한 자음동화. 뒷글자가
        const jointConsonant = Utils.jointConsonant;

        //뒷글자에 의한 ㅣ 모음동화 잡아내기
        const jointVowel = Utils.jointVowel;

        //우선 유사초음 찾아내기. 밑바탕(!들어감) 자음의 유사자음 리스트 안에 원 자음이 들어가는 경우
        if (compDisassemble["cho"][0] === charDisassemble["cho"][0] || (simInit[compDisassemble["cho"][0]]!==undefined && simInit[compDisassemble["cho"][0]].indexOf( charDisassemble["cho"][0] )!== -1)) {
            resi = true;
        }

        // 유사중음 찾아내기. 치음의 경우

        if (Utils.objectEqual(compDisassemble["jung"], charDisassemble["jung"])) {
            resm = true;
        }
        else if (toothConsonant.indexOf(charDisassemble["cho"][0])!== -1 && Utils.objectIn(charDisassemble["jung"], toothSimMiddle[Hangul.assemble(compDisassemble["jung"])] ) === true) {
            resm = true;
        }
        else if (toothConsonant.indexOf(charDisassemble["cho"][0])=== -1 && Utils.objectIn(charDisassemble["jung"], simMiddle[Hangul.assemble(compDisassemble["jung"])] ) === true) {
            resm = true;
        }
        // 모음 동화 반영
        else if (followDisassemble["jung"].length>0 && Utils.objectIn( followDisassemble["jung"],[["ㅣ"], ["ㅡ","ㅣ"], ["ㅜ","ㅣ"]]) === true && Utils.objectIn( charDisassemble["jung"], jointVowel[Hangul.assemble(compDisassemble["jung"])]) === true) {
            resm = true;
        }

        // 유사종음 찾아내기.
        // 우선 두 글자 받침이 동일할 때는 무조건 OK
        if (Utils.objectEqual(compDisassemble["jong"], charDisassemble["jong"])) {
            rese = true;
        }
        else if (Utils.objectIn(charDisassemble["jong"], simEnd[compDisassemble["jong"]])) {
            rese = true;
        }
        // 또 comp 받침 글자를 char가 포함하는 경우 무조건 OK
        else if (compDisassemble["jong"].length>0 && Utils.objectInclude(compDisassemble["jong"], charDisassemble["jong"]) ) {
            rese = true;
        }
        // 자음동화. comp에 받침이 없을 때 받침 맨 뒷글자가 follow의 초성과 자음동화를 이룰 때
        else if (followDisassemble["cho"].length>0 && compDisassemble["jong"].length ===0 &&  charDisassemble["jong"].slice(-1)[0] === followDisassemble["cho"][0] ) {
            rese = true;
        }
        else if (followDisassemble["cho"].length>0 && compDisassemble["jong"].length ===0 && jointConsonant[ followDisassemble["cho"][0] ]!== undefined && jointConsonant[ followDisassemble["cho"][0] ].indexOf( charDisassemble["jong"].slice(-1)[0] ) !==-1 ) {
            rese = true;
        }

        return resi && resm && rese;
    }

    //어떤 단어가 다른 단어에 포함되는지 체크하기
    static wordInclude(inc, exc) {
        // wordToArray 형태로 inc, exc 변환하기
        if (typeof inc === "string") inc = Utils.wordToArray(inc);
        else if (Array.isArray(inc)) inc = Utils.wordToArray(inc.join(""));

        if (typeof exc === "string") exc = Utils.wordToArray(exc);
        else if (Array.isArray(exc)) exc = Utils.wordToArray(exc.join(""));

        // 포함관계 체크하기
        let tempCnt = 0;
        let val = false;
        for (let incCnt in inc) {
            // inc 낱자 파싱
            let mainChar = inc[incCnt][0]; // 기본 낱자
            let parserChar = inc[incCnt][1]; // 파싱 낱자. ! 또는 ?
            let astLength = (parserChar==="!"|| parserChar==="+")? inc[incCnt].length-2: inc[incCnt].length-1; // ? 갯수

            while(tempCnt < exc.length) {
                // exc 낱자 파싱
                let excChar = exc[tempCnt][0] // 낱자
                let excParserChar = exc[tempCnt][1] // exc 파싱 낱자
                let excAstLength = excParserChar==="!"?exc[tempCnt].length-2:exc[tempCnt].length-1; // ext ? 갯수

                //낱자의 astLength는 exc 배열 낱자의 astLength보다 우선 짧아야 한다.
                if (astLength <= excAstLength){
                    // excParserChar가 !표시, 즉 유사 낱자 다 포함할 때.
                    if (excParserChar === "!" && parserChar !=="!") {
                        if (this.isKindChar(mainChar, excChar)) {
                            val = true;
                            if (incCnt<inc.length-1) tempCnt++;
                            break;
                        }
                        else tempCnt++;
                    }
                    else {
                        if (mainChar === excChar) {
                            val = true;
                            if (incCnt<inc.length-1) tempCnt++;
                            break;
                        }
                        else tempCnt++;
                    }
                }
                // tempCnt에서 astLength가 더 긴게 있다면 넘어가자
                else {
                    tempCnt++;
                }
            }
            // for 루프 탈출조건.
            if (tempCnt === exc.length) {
                val = false;
                break;
            }
        }
        return val;

    }

    // 한글 조합 함수. 각 원소들을 Hangul.assemble(Hangul.disassemble())로 조합하는데 사용합니다. isComma 옵션은 파서 문자 ,를 무시할지 물어봅니다.
    static assembleHangul(elem, isIgnoreComma = true) {
        return Utils.listMap(elem, x=>(
            isIgnoreComma ? Hangul.assemble(Hangul.disassemble(x)).replace(".,", "，").replace(",","").replace("，",",")
                : Hangul.assemble(Hangul.disassemble(x))
        ));
    }

    // 단어 리스트가 존재할 때 parse하는 함수
    static parseFromList(wordList) {
        let res  = []
        for (let word of wordList) {
            res.push(Utils.wordToArray(word))
        }
        res.sort((a,b) => (a.length-b.length)).reverse()

        return res;
    }

    /**
     * 비속어는 음절별로 발음이 약간씩
     * 달라질 수 있기 때문에 각 음절별로
     * 모든 조합의 구성이 필요합니다.
     *
     * 그러나 이를 직접 적으면 데이터 용량이 늘뿐더러
     * 편집자도 힘드므로 각 음절별 변형음을 2차원구조로 표현합니다.
     *
     *
     * 이 함수는 필터에 사용될 비속어를 2차원 배열 형태로
     * 조합될 단어의 목록을 구성할 수 있게 돕습니다.
     *
     * 2차원 배열은 before+after 의 구조로
     * 각 차원 데이터가 합쳐져서 단어를 구성하게 되며
     *
     * 2차원 배열 내 다시 2차원 배열을 둘 수 있습니다.
     *
     * @param {array} data
     */
    static recursiveComponent (data, variable={}, nonParsedVariable = null) {
        // data : array.

        // console.log('recursiveComponent() start')

        // 데이터의 전항 후항을 순회합니다.
        for(let i=0;i<=1;i++){

            // 데이터의 모든 항목을 순회합니다.
            for(let itemIndex in data[i]){
                let item = data[i][itemIndex]

               // console.log("item LIST:::", item)

                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                if(Array.isArray(item)){
                    let solvedData = this.recursiveComponent(item, variable, nonParsedVariable)
                    // console.log("SOLVEDDATA", solvedData)
                    data[i][itemIndex] = null
                    data[i] = data[i].concat(solvedData)
                    // data[i] = this.assembleHangul(data[i])

                } else if(!Array.isArray(item) && typeof item === 'object'){

                    // 부가 함수를 사용한 경우
                    // 지정된 함수가 반환하는 리스트를 반영합니다.
                    data[i] = data[i].concat(this.recursiveComponent(item, variable, nonParsedVariable))
                    // data[i] = this.assembleHangul(data[i])

                } else if(typeof item === 'string' && item[0] === '*'){

                    // 만약 변수를 사용했다면 (단어 앞에 *로 시작) 해당 부분을
                    // 변수의 리스트로 대치합니다.
                    // console.log("item", item)
                    let varName = item.slice(1);
                    // console.log(item, `함수호출됨: ${varName}`)

                    // 엘레멘트 이름이 "*사랑"일 때, 여기서 variable의 변수는 {"사랑":(리스트)} 형식으로 정의할 수 있다.
                    // console.log("varName", varName)

                    if(typeof variable[varName] !== 'undefined'){
                       //  console.log(`1함수호출됨: ${varName}`)

                        data[i] = data[i].concat(variable[varName])
                        // data[i] = this.assembleHangul(data[i])
                    }
                    // 아니면 nonParsedVariable에서 변수가 있는지 확인해보기.
                    else {
                       //  console.log(`2함수호출됨: ${varName}`)
                        // 만약 변수 안에서 변수를 참조한 경우
                        // 필요한 부분의 변수만 파싱하여 해당 리스트를 구성합니다.
                        if(nonParsedVariable !== null){
                          //   console.log(`2함수진행됨: ${varName}`)
                            let parsedHeaderVariable = this.recursiveList(nonParsedVariable[varName], nonParsedVariable, true)
                            data[i] = data[i].concat(parsedHeaderVariable)
                            // data[i] = this.assembleHangul(data[i])
                           //  console.log(`2함수결과:`)
                           //  console.log(parsedHeaderVariable.length)
                            if(parsedHeaderVariable.length == 0)
                                throw new Error (`${varName} 변수를 찾을 수 없습니다. 또는 변수 내부 길이가 0입니다.`)
                        }else{
                            throw new Error (`nonParsedVariable 전해받지 못함, ${varName} 변수를 찾을 수 없습니다.`)
                        }
                    }
                    data[i][itemIndex] = null
                }
            }
        }

        // 데이터의 전항 후항을 순회합니다.
        let solvedData = []
        for(let before of data[0]){
            if(before === null) continue
            for(let after of data[1]){
                if(after === null) continue
                solvedData.push(before+after)
            }
        }
        // console.log('recursiveComponent() end')
        return solvedData
    }

    /**
     * 이 함수로 배열을 감싸면 비속어 단어 정의용
     * 데이터 표현 포멧을 바로 쓸 수 있게 해줍니다.
     *
     * @param {array} list
     * @param {object} variable { 키값: [list] } 형식으로 정의
     * @param {boolean} isVariableParse variable에서 list가 완전히 파싱됐는지 여부 확인
     * @param {string} defaultType
     *
     * @returns {array} solvedList
     */

    static recursiveList (list, variable = null, isVariableParse = false, defaultType = 'string') {
        // console.log('recursiveList() start')

        // 변수단을 해석처리합니다.
        let parsedVaraible = {}

        // variable의 리스트가 완전히 파싱된 상태가 아니면 variable 리스트를 파싱해서 처리함.
        if(variable !== null && !isVariableParse){
            for(let varItemIndex in variable)
                parsedVaraible[varItemIndex] = this.recursiveList(variable[varItemIndex], variable, true)
        }

        // 코드단을 해석처리합니다.
        // 결과 리스트
        let rebuild = []
        // 리스트의 엘리먼트에 대해서
        for(let itemIndex in list){
            // console.log("ITEMINDEX:::", list[itemIndex])
            let item = list[itemIndex]

            if(typeof item === defaultType){

                // 그냥 문자열이면 바로 리스트에 반영합니다.
                // *로 시작하지 않는 경우 - 한글 분해 후 재조합.
                if(item[0] !== '*'){
                    rebuild.push(item)
                }
                else {

                    // 만약 변수를 사용했다면 해당 부분을
                    // 변수의 리스트를 반영합니다.
                    let varName = item.slice(1);
                    if(typeof parsedVaraible[varName] !== 'undefined' && !isVariableParse){
                        // console.log("\n\nParsedVariable", parsedVaraible[varName])
                        rebuild = rebuild.concat(parsedVaraible[varName])
                        // rebuild = this.assembleHangul(rebuild)
                    }else{
                        if(isVariableParse){

                            // 정의된 변수가 없는데 변수가 들어갔으면
                            // 해당 변수만 별개로 해석하여 리스트에 첨부합니다.
                            let parsedHeaderVariable = this.recursiveList(variable[varName], variable, true)
                            // console.log("\n\nParsedHeaderVariable", parsedHeaderVariable)
                            rebuild = rebuild.concat(parsedHeaderVariable)
                            // rebuild = this.assembleHangul(rebuild)
                        }else{
                            throw new Error(`${varName} 음절 변수를 찾을 수 없습니다.`)
                        }
                    }
                }

            }else if(Array.isArray(item) && typeof item === 'object'){

                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                rebuild = rebuild.concat(this.recursiveComponent(item, parsedVaraible, variable))
                // rebuild = this.assembleHangul(rebuild)
            }else{

                // 부가 함수를 사용한 경우
                // 지정된 함수가 반환하는 리스트를 반영합니다.
                rebuild = rebuild.concat(this.additionalType(item, parsedVaraible, variable))
                // rebuild = this.assembleHangul(rebuild)
            }
        }
        // console.log('recursiveList() end')
        return rebuild
    }

    /**
     * 데이터를 가지고 있다가
     * 해당 데이터가 빌드될 때 어떻게 처리할지를
     * 함수를 통해 정의할 수 있습니다.
     *
     * 이 메소드 내 함수명을 정의함을 통해서
     * 빌드 과정에서 데이터에 간섭할 수 있습니다.
     *
     * @param {object} component
     * @param {object} parsedVaraible
     * @param {object} nonParsedVariable
     */
    static additionalType(component, parsedVaraible, nonParsedVariable = null){
        console.log('additionalType() start')
        let list = []
        //let defaultList = this.recursiveComponent(component.data, parsedVaraible, nonParsedVariable)

        switch(component.type){
            case '단어병합':
                list = this.recursiveComponent(component.data, parsedVaraible, nonParsedVariable)
                break
            case '자모합성':
                for(let item of this.recursiveComponent(component.data, parsedVaraible, nonParsedVariable)){
                    item = item.split('')
                    // console.log(item)
                    list.push(item)
                }
                break
        }

        /* 아래부터는 공통기능을 구현합니다. */

        // 생성된 리스트 중 일부 단어 배제 기능
        if(typeof component['exclude'] !== 'undefined'){
            let preList = []
            for(let item of list){
                if(component['exclude'].indexOf(item) === -1)
                    preList.push(item)
            }
            list = preList
        }

        console.log('additionalType() end')
        return list
    }
}

module.exports = Tetrapod;
