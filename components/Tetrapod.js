let Hangul = require('hangul-js');
let fs = require('fs');
let Utils = require('./Utils');

// 기본 경로
let badWordDefaultPath = './dictionaries/bad-words.json'
let normalWordDefaultPath = './dictionaries/normal-words.json';
let macroDefaultPath = './dictionaries/macros.json';


class Tetrapod {

    // 사전데이터들을 배열형태로 저장해서 보관합니다. (json)

    constructor() {
        this.originalBadWordsData = {} // 원본 비속어 데이터. 기본값은 bad-words.json 데이터
        this.originalNormalWordsData = {} // 원본 정상단어 데이터. 기본값은 normal-words.json 데이터
        this.badWordMacros = {} // 원본 매크로 데이터. 기본값은 macro.json 데이터
        this.badWords = {
            0: [], 1:[], 2:[], 3:[], 4:[]
        }; // 비속어 - 수준별 분류
        this.typeofBadWords = {
            drug:[], insult:[], sexuality:[], violence:[]
        } // 비속어 타입별로 분류하기
        this.normalWords = [] // 정상단어
        this.exceptWords = [] // 정상단어에서 제외할 단어.

        // 빠른 비속어단어 확인을 위해 사전에 단어목록을 한글자씩 조각내놓고 사용합니다.
        // 예 : [시!발+] => [[시!],[발+]]
        this.parsedBadWords = [] // 모든 비속어 합쳐서 분류 완료
        this.badWordInfo = []; // 비속어 단어 정보. 각 원소에 [단어, 랭크, 타입] 형식으로 출력.

        // 비속어, 정상단어 활성/비활성화를 용이하게 하기 위해서 맵을 추가합니다. {단어:true -> 활성화}
        this.badWordsMap = {} // 비속어 맵. {단어:타입, 비활성화시 false}
        this.normalWordsMap = {}
        this.exceptWordsMap = {}

        // 로딩 시작 시점
        this.startTime = new Date().getTime(); // 시작시점 확인
        // 재파싱 필요 여부 체크
        this.preParsed = true;

        // 리스트 유형 확인
        this.badWordLevel = [] // [1,2,3,4]의 부분집합으로 선택. 기본값은 0번만 활성화
        this.typeCheck = [] // 비속여의 출력할 유형 확인. drug(약물), insult(모욕), sexuality(성적표현), violence(폭력) 중 선택 가능.
        this.checkOptions = [] // 비속어 추가 찾기 옵션 확인. qwerty(영자판 섞기), antispoof(문자섞기), pronounce(발음) 옵션 추가.
        this.dropDoubleCheck = false; // dropDouble로 축약화시킨 메시지도 검사하기 여부. 체크시 dd, dd+simplify된 메시지도 같이 검사.
    }

    // 일부 Utils 함수는 독립적으로도 사용할 수 있어서 static 클래스 처리
    // 문장 위치 바꾸기
    static replaceAll = Utils.replaceAll;

    // 문장에서 단어 위치 찾아주는 함수
    static getPositionAll = Utils.getPositionAll;

    // 단어를 낱자 리스트로 분리하는 함수
    static wordToArray = Utils.wordToArray;

    // 맵 정렬 함수
    static sortMap = Utils.sortMap;

    // 단어 리스트 정렬 함수
    static parseFromList = Utils.parseFromList;

    // 단어를 초중종성으로 분리하기. cond 값이 part면 단순초중성, key면 키보드 기준, sound면
    static disassemble = Utils.disassemble;

    // 한글 낱자 초중종 분리
    static choJungJong = Utils.choJungJong;

    // 메시지 심플하게 맵으로 바꾸기
    static msgToMap = Utils.msgToMap;

    // 한영변환 자판 혼합시에 한글 낱자로 모두 변환한 뒤에 조합
    static qwertyToDubeol = Utils.qwertyToDubeol;

    // 자음, 모음과 유사한 글자를 한글자모로 모두 변환한 뒤에 조합
    static antispoof = Utils.antispoof;

    // 로마자로 표시된 음을 한글로 치환한 후에 조합
    static engToKo = Utils.engToKo;

    // 이우 -> 유 등 합칠 수 있는 한글 음가를 단축해서 합치는 함수
    static dropDouble = Utils.dropDouble;

    // ㄳ, ㄺ,ㄻ,ㅄ 받침 과잉 사용하는 것 검출하는 함수
    static tooMuchDoubleEnd = Utils.tooMuchDoubleEnd;

    // 유사 낱자 검사
    static isKindChar = Utils.isKindChar;

    // 낱자 포함되는지 검사하는 함수
    static isInChar = Utils.isInChar;

    // 매크로 패턴 word가 다른 매크로 패턴 comp에 포함되는지 확인하는 함수
    static wordIncludeType = Utils.wordIncludeType;

    //
    static wordInclude = Utils.wordInclude;

    // 한글 자모로 분해된 문자열을 찾아서 한글을 조합하는 함수
    static assembleHangul = Utils.assembleHangul;




    // 비속어 데이터, 정상단어 데이터 불러오기. 데이터 개별 수정은 복잡하므로 이 함수로만 수정할 예정.
    load(inputWordsObject /* 오브젝트 형식으로 호출 */, disableAutoParse = true) {
        this.originalBadWordsData = inputWordsObject.originalBadWordsData;
        this.originalNormalWordsData = inputWordsObject.originalNormalWordsData;
        this.badWordMacros = inputWordsObject.badWordMacros;
        this.preParsed = false; // 재파싱 필요 여부 결정.
        this.startTime = new Date().getTime(); // 시작시점 재지정
        console.log("LOADING...");
        if (disableAutoParse !== false) {
            this.parse();
        }
    }

    // 비속어 사전 파일 로딩함. path 지정하지 않으면 기본경로에서 가져옴.
    loadFile(
        badWordsPath = badWordDefaultPath,
        normalWordsPath = normalWordDefaultPath,
        macroPath = macroDefaultPath,
        disableAutoParse = true
    ) {
        const data = {
            originalBadWordsData: require(badWordsPath), // 비속어 데이터
            originalNormalWordsData: require(normalWordsPath),//정상 데이터
            badWordMacros: require(macroPath), //매크로 데이터
        }
        this.load(data, disableAutoParse); // 파일 호출
    }

    // 리스트 형식으로 된 BadWord 단어들을 wordToArray 이용해서 단어 조각낸 2차원배열로 풀어쓰기 [['시','발'], ...]
    parse() {
        console.log("Parsing Start", new Date().getTime() - this.startTime)

        let parsedMacros = this.badWordMacros;
        for(let idx in parsedMacros) {
            if (typeof parsedMacros[idx] ==='object') parsedMacros[idx] = this.recursiveList(parsedMacros[idx]);
        }

        // 우선 badWords, typeofBadWords, normalWords, exceptWords 파싱을 한다.
        // preParsed ->
        if (!this.preParsed) {
            this.badWords = {
                0: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.badWords, parsedMacros)),
                1: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.badWordsOne, parsedMacros)),
                2: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.badWordsTwo, parsedMacros)),
                3: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.badWordsThree, parsedMacros)),
                4: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.badWordsFour, parsedMacros))
            };
            this.typeofBadWords = {
                drug: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.drug, parsedMacros)), // 유형별 비속어 데이터 리스트로 풀기
                insult: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.insult, parsedMacros)),
                sexuality: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.sexuality, parsedMacros)),
                violence: Utils.assembleHangul(this.recursiveList(this.originalBadWordsData.violence, parsedMacros)),
            };
            this.normalWords = Utils.assembleHangul(this.recursiveList(this.originalNormalWordsData.dictionary, parsedMacros))
            this.exceptWords = Utils.assembleHangul(this.recursiveList(this.originalNormalWordsData.exception, parsedMacros));

            this.preParsed = true;
        }

        console.log("Data filled", new Date().getTime() - this.startTime);

        // 초기화 필요합니다.
        this.parsedBadWords = [];

        // badWords 매핑은 {0: [], 1: [], 2:[], 3:[], 4:[]}
        for (let index in this.badWords) {
            for (let wid in this.badWords[index]) {
                this.parsedBadWords.push([Utils.wordToArray(this.badWords[index][wid]), this.badWords[index][wid], index, 'etc']) // parsedBadWords에 단어 추가
            }
        }
        // 그 다음 각 단어에 타입 지정하기
        for (let idx in this.parsedBadWords) {
            let word = this.parsedBadWords[idx][1];
            if (this.typeofBadWords.drug.indexOf(word) > -1) {
                this.parsedBadWords[idx][3] = 'drug';
            } else if (this.typeofBadWords.insult.indexOf(word) > -1) {
                this.parsedBadWords[idx][3] = 'insult';
            } else if (this.typeofBadWords.sexuality.indexOf(word) > -1) {
                this.parsedBadWords[idx][3] = 'sexuality';
            } else if (this.typeofBadWords.violence.indexOf(word) > -1) {
                this.parsedBadWords[idx][3] = 'violence';
            }
        }

        console.log("before Sorting Words", new Date().getTime() - this.startTime)
        this.parsedBadWords.sort((a, b) => a[1].length - b[1].length).reverse();


        // parsedBadWords에 맞추어 순서 삽입할 예정이므로 일단 비움. 개별적 sorting보다는 단순 삽입이 다 효율적임.
        this.badWords = {
            0:[], 1:[], 2:[], 3:[], 4:[]
        }
        this.typeofBadWords = {
            drug:[], insult:[], sexuality:[], violence:[]
        }
        this.badWordsMap = {} // 재구성을 할 예정이라 초기화한다
        this.normalWordsMap = {}
        this.exceptWordsMap = {}

        for (let ind in this.parsedBadWords) {
            // 비속어 수준별로 단어 추가
            let word = this.parsedBadWords[ind][1];

            switch(this.parsedBadWords[ind][2]) {
                case '0':
                    this.badWords['0'].push(word);
                    this.badWordsMap[word] = 'etc'; // 여기에 속한 단어는 무조건 비속어 검사대상이다.
                    break;
                case '1':
                    this.badWords['1'].push(word);
                    this.badWordsMap[word] = this.badWordLevel.indexOf(1)>-1?'etc':false;
                    break;
                case '2':
                    this.badWords['2'].push(word);
                    this.badWordsMap[word] = this.badWordLevel.indexOf(2)>-1?'etc':false;
                    break;
                case '3':
                    this.badWords['3'].push(word);
                    this.badWordsMap[word] = this.badWordLevel.indexOf(3)>-1?'etc':false;
                    break;
                case '4':
                    this.badWords['4'].push(word);
                    this.badWordsMap[word] = this.badWordLevel.indexOf(4)>-1?'etc':false;
                    break;
            }
            // 비속어 종류별로 단어 추가.
            switch(this.parsedBadWords[ind][3]) {
                case 'drug':
                    this.typeofBadWords['drug'].push(word);
                    if(this.badWordsMap[word] && this.typeCheck.indexOf('drug')>-1) this.badWordsMap[word] = 'drug';
                    break;
                case 'insult':
                    this.typeofBadWords['insult'].push(word);
                    if(this.badWordsMap[word] && this.typeCheck.indexOf('insult')>-1) this.badWordsMap[word] = 'insult';
                    break;
                case 'sexuality':
                    this.typeofBadWords['sexuality'].push(word);
                    if(this.badWordsMap[word] && this.typeCheck.indexOf('sexuality')>-1) this.badWordsMap[word] = 'sexuality';
                    break;
                case 'violence':
                    this.typeofBadWords['violence'].push(word);
                    if(this.badWordsMap[word] && this.typeCheck.indexOf('violence')>-1) this.badWordsMap[word] = 'violence';
                    break;
            }
        }

        // normalWords, ExceptWord도 소팅하기
        this.normalWords = Utils.sortMap(this.normalWords);
        this.exceptWords = Utils.sortMap(this.exceptWords);

        // normalWordsMap, exceptWordsMap 유도
        let word
        for (word of this.normalWords) {
            this.normalWordsMap[word] = true;
        }
        for (word of this.exceptWords) {
            this.exceptWordsMap[word] = true;
        }

        // 마지막으로 리스트 나누기로 유도하기...
        this.badWordInfo = this.parsedBadWords.map(x=> x.slice(1))
        this.parsedBadWords = this.parsedBadWords.map(x=>x[0])

        console.log("End of PARSING WORDS", new Date().getTime() - this.startTime)

    }

    // 비속어 수준 및 타입 조절. 변수 사용하지 않으면 현재 수준 출력.
    // 사용방법 : adjustFilter([1], ['insult'], ['qwerty'], false) ->
    adjustFilter(level = this.badWordLevel, type = this.typeCheck, checkOptions = this.checkOptions, dropDoubleCheck = this.dropDoubleCheck) {
        this.badWordLevel = Array.isArray(level) ? level :this.badWordLevel;
        this.typeCheck = Array.isArray(type) ? type :this.typeCheck; // 아직 타입체크 관련 기능은 구현이 안 됨.
        this.checkOptions = Array.isArray(checkOptions)? checkOptions: this.checkOptions;
        this.dropDoubleCheck = dropDoubleCheck;
        this.parse(); // 워딩은 재파싱으로 조절한다.
        console.log('체크 중인 비속어 수준:::', level);
        console.log('출력할 비속어 유형:::', type);
        console.log('추가 검사 중인 영자혼합 유형:::',checkOptions);
        console.log('중복음 단축된 메시지 검사 여부:::', dropDoubleCheck);
    }

    // 비교시간 단축을 위한 테크닉.
    // 리스트들의 목록 List에 대해 리스트 elem이 List 안에 있는지 판별하기.
    testInList(elem, List) {
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

    // 사용자 정의 데이터 불러오기
    getLoadedData() {
        return {
            badWords: this.badWords, // 비속어 수준별 리스트
            normalWords: this.normalWords, // 정상단어 리스트
            exceptWords: this.exceptWords, // 예외단어 리스트
            typeofBadWords: this.typeofBadWords, // 비속어 유형별 리스트
            parsedBadWords: this.parsedBadWords, // 모든 비속어 합쳐서 분류 완료
            badWordInfo: this.badWordInfo, // 비속어 단어 정보. 각 원소에 [단어, 랭크, 타입] 형식으로 출력.
            badWordsMap: this.badWordsMap, // badWordsMap - 비속어 사용 여부 체크 맵. 필터 강도에 따라 사용여부를 껐다 켰다 할 수 있음.
            normalWordsMap: this.normalWordsMap, // normalWordsMap - 정상 단어 사용 여부 체크 맵
            exceptWordsMap: this.exceptWordsMap // exceptWordsMap - 예외단어 사용 여부 체크 맵
        }
    }

    // 데이터 저장하기 - 현재 작동하지 않음.
    saveAllData(badWordsPath=badWordDefaultPath, normalWordsPath = normalWordDefaultPath, badWordMacrosPath = macroDefaultPath, isAsync=false) {
        this.parse();
        this.saveBadWordsData(badWordsPath, isAsync)
        this.saveNormalWordsData(normalWordsPath, isAsync)
        this.saveBadWordMacros(badWordMacrosPath, isAsync)
    }

    // 매크로 저장
    saveBadWordMacros(path, isAsync) {
        let data = JSON.stringify(this.badWordMacros, null, 4);
        if (isAsync) fs.writeFile(path, data, 'utf-8', (err) => {if (err) {console.log(err)}})
        else fs.writeFileSync(path, data, 'utf-8',(err) => {if (err) {console.log(err)}})
    }

    // 비속어 데이터 출력
    saveBadWordsData(path, isAsync) {
        let data = JSON.stringify(this.originalBadWordsData, null, 4)
        if(isAsync) fs.writeFile(path, data, 'utf-8', (err) => {if (err) {console.log(err)}})
        else fs.writeFileSync(path, data, 'utf-8', (err) => {if (err) {console.log(err)}})
    }

    // 정상단어 출력
    saveNormalWordsData(path, isAsync) {
        let data = JSON.stringify(this.originalNormalWordsData, null, 4)
        if(isAsync) fs.writeFile(path, data, 'utf-8', (err) => {if (err) {console.log(err)}})
        else fs.writeFileSync(path, data, 'utf-8', (err) => {if (err) {console.log(err)}})
    }

    // 메시지에 비속어가 들어갔는지 검사.
    isBad(message) {
        let resObj = this.find(message,false, 20);
        for (let key in resObj) {
            // 하나라도 비어있지 않은 오브젝트가 발견되면 True.
            if (Array.isArray(resObj[key]) && resObj[key].length>0) {
                return true;
            }
        }
        return false;
    }

    // 메시지에 비속어가 몇 개 있는지 검사.
    countBad(message) {

        let res, dropDoubleChecked = {};

        if (this.dropDoubleCheck) {
            dropDoubleChecked = {
                ddBad: this.find(message, true, 0).ddFound.length,
                ddsBad: this.find(message, true, 0).ddsFound.length
            }
        }
        res = {
            bad: this.find(message, true, 0).found.length,
            end: this.find(message, true, 0).doubleEnd.length,
            ...dropDoubleChecked
        };

        // qwertyTest
        if (this.checkOptions.indexOf('qwerty')>-1) {
            dropDoubleChecked ={};
            if (this.dropDoubleCheck) {
                dropDoubleChecked = {
                    qwertyDdBad: this.find(message, true, 0).qwertyDdFound.length,
                    qwertyDdsBad: this.find(message, true, 0).qwertyDdsFound.length
                }
            }
            res = {
                ...res,
                qwertyBad: this.find(message, true, 0).qwertyFound.length,
                qwertyEnd: this.find(message, true, 0).qwertyDoubleEnd.length,
                ...dropDoubleChecked
            };
        }

        // antispoof
        if (this.checkOptions.indexOf('antispoof')>-1) {
            dropDoubleChecked ={};
            if (this.dropDoubleCheck) {
                dropDoubleChecked = {
                    antispoofDdBad: this.find(message, true, 0).antispoofDdFound.length,
                    antispoofDdsBad: this.find(message, true, 0).antispoofDdsFound.length
                }
            }
            res = {
                ...res,
                antispoofBad: this.find(message, true, 0).antispoofFound.length,
                antispoofEnd: this.find(message, true, 0).antispoofDoubleEnd.length,
                ...dropDoubleChecked
            };
        }

        // pronounce
        if (this.checkOptions.indexOf('pronounce')>-1) {
            dropDoubleChecked ={};
            if (this.dropDoubleCheck) {
                dropDoubleChecked = {
                    pronounceDdBad: this.find(message, true, 0).pronounceDdFound.length,
                    pronounceDdsBad: this.find(message, true, 0).pronounceDdsFound.length
                }
            }
            res = {
                ...res,
                pronounceBad: this.find(message, true, 0).pronounceFound.length,
                pronounceEnd: this.find(message, true, 0).pronounceDoubleEnd.length,
                ...dropDoubleChecked
            };
        }

        return res;
    }

    // 메시지에 비속어 찾기 - 배열로 처리함.
    // 20220715 수정 - nativeFind와 유사한 형태로 결과 출력.
    find(message, needMultipleCheck=true, splitCheck=20, isStrong=this.dropDoubleCheck, recursive = true ) {


        // 결과 출력 방식
        let res = {
            message: message, // 검사 메시지
            found: [], // 발견된 비속어
            positions: [], // 발견된 비속어 포지션
            keyWord: [], // 발견된 비속어 키워드
            type: [], // 발견단 비속어
            doubleEnd: [], // 부적절한 겹받침
            doubleEndPositions: [] //부적절한 겹받침 위치
        }

        // 편의상 메시지를 나누어서 처리하기. 20개 단위로 처리
        if (splitCheck === undefined) splitCheck = 20
        let messages = (splitCheck !== 0) ? Utils.lengthSplit(message, splitCheck) : [message];

        const fullLimit = splitCheck!==0? splitCheck: message.length; // 메시지 길이
        const halfLimit = splitCheck !==0? Math.floor(splitCheck/2): 0; // 절반 메시지 길이.

        // lengthSplit 자체가 길이의 반 단위로 잘라서 검사한다.
        // 따라서 쪼갤 때 비속어가 2번 검출하는 오류를 잡기 위해 체크하는 값 추가.
        let adjustment = 0; // 보정 포지션 체크
        for (let idx =0; idx<messages.length; idx++) {
            adjustment = Math.floor(idx/2)*fullLimit + (idx%2)* halfLimit; // 문장 내 x의 보정 포지션 지정하기
            // 같은 비속어 키워드여도 여러 개 비속어 대응이 가능하므로 msgToMap을 이용해서 여러 개 찾아준다.
            let curResult = this.nativeFind(Utils.msgToMap(messages[idx]), needMultipleCheck, true,false, false);

            // 비어있지 않을 때에만 처리하기
            if (curResult.originalFound.length>0) {
                let tempKeys = curResult.found; // 비속어 키워드 형태
                let tempType = curResult.type; // 비속어 타입
                let tempFound = curResult.originalFound; // 비속어 원문
                let tempPositions = curResult.positions; // 비속어 위치
                let tempDEFound = curResult.tooMuchDoubleEnd.txt; // 겹받침
                let tempDEPositions = curResult.tooMuchDoubleEnd.pos.map(x=> x+adjustment); //겹받침 위치
                // 비속어 추가하는 전략
                for (let idx1 in tempKeys) {
                    let keyWord = tempKeys[idx1]; // 비속어 키워드 단어
                    let keyType = tempType[idx1]; // 비속어 키워드 타입
                    let tempPosition = tempPositions[idx1]; // 키워드에 해당되는 단어위 위치
                    for (let idx10 in tempPosition) {
                        let posVector = tempPosition[idx].map(x=> x+adjustment);
                        // posVector가 positions 정보에 없을 때에만 추가
                        if (!Utils.objectIn(posVector, res.positions)) {
                            res.found.push(tempFound[idx1][idx10]); // 원문 상에서 발견된 값
                            res.positions.push(posVector); // 원문 상에서의 위치
                            res.keyWord.push(keyWord);
                            res.type.push(keyType);
                        }
                    }
                }

                // 부적절한 겹받침 위치 찾아내기
                for (var idx2 in tempDEPositions) {
                    if (res.doubleEndPositions.indexOf(tempDEPositions[idx2]) === -1) {
                        res.doubleEnd.push(tempDEFound[idx2]);
                        res.doubleEndPositions.push(tempDEPositions[idx2]);
                    }
                }
                // needMultipleCheck가 거짓이면 잡아냈을 때 작업 중단합시다.
                if (!needMultipleCheck && res.positions.length>0) {
                    res.found = res.found.slice(0,1); // 결과 하나만 추출
                    res.positions = res.positions.slice(0,1); // 결과 하나만 추출
                }
            }
        }

        // isStrong 옵션이 있을 때에는 dropDouble한 메시지도 같이 검사한다.
        if(isStrong && (needMultipleCheck || res.positions.length ===0)) {
            // 결과 추가
            let ddMap = Utils.dropDouble(message, true);
            let ddsMap = Utils.dropDouble(message, true, true);
            let ddMessage = Utils.parseMap(ddMap, true).joinedParsedMessage;
            let ddsMessage = Utils.parseMap(ddsMap, true).joinedParsedMessage;
            let resPlus = {
                ddMessage: ddMessage, ddFound: [], ddPositions: [], ddKeyWord: [], ddType: [],
                ddsMessage: ddsMessage, ddsFound: [], ddsPositions: [], ddsKeyWord: [], ddsType:[]
            }

            let ddFind = this.find(ddMessage, needMultipleCheck, splitCheck, false, false);
            let ddsFind = this.find(ddsMessage, needMultipleCheck, splitCheck, false, false);
            let ddFindPositions = ddFind.positions;
            let ddsFindPositions = ddsFind.positions;

            // ddFind.positions 기준으로 조회
            // found, positions, keyWord, type은 모두 길이가 동일하다는 점을 이용해보자.
            for (let idx3  in ddFindPositions) {
                let oddPosition = Utils.originalPosition(ddMap, ddFindPositions[idx3]);
                if (!Utils.objectIn(oddPosition, res.positions)) {
                    resPlus.ddPositions.push(oddPosition);
                    let originalWord = message.split("").filter((x, idx)=> (oddPosition.indexOf(idx)>-1)).join("");
                    resPlus.ddFound.push(originalWord);
                    let ddFoundKey = ddFind.keyWord[idx3];
                    resPlus.ddKeyWord.push(ddFoundKey);
                    let ddType = ddFind.type[idx3];
                    resPlus.ddType.push(ddType);
                }
                if (!needMultipleCheck && resPlus.ddPositions.length > 0) break;
            }

            // ddFind.positions 기준으로 조회
            // found, positions, keyWord, type은 모두 길이가 동일하다는 점을 이용해보자.
            if (needMultipleCheck || resPlus.ddPositions.length===0) {
                for (let idx4  in ddsFindPositions) {
                    let oddsPosition = Utils.originalPosition(ddsMap, ddsFindPositions[idx4]);
                    if (!Utils.objectIn(oddsPosition, res.positions) && !Utils.objectIn(oddsPosition, resPlus.ddPositions)) {
                        resPlus.ddsPositions.push(oddsPosition);
                        let originalWord = message.split("").filter((x, idx) => (oddsPosition.indexOf(idx) > -1)).join("");
                        resPlus.ddsFound.push(originalWord);
                        let ddsFoundKey = ddsFind.keyWord[idx4];
                        resPlus.ddsKeyWord.push(ddsFoundKey);
                        let ddsType = ddsFind.type[idx4];
                        resPlus.ddsType.push(ddsType);
                    }
                    if (!needMultipleCheck && resPlus.ddsPositions.length > 0) break;
                }
            }

            res = {...res, ...resPlus}; // 결과 합치기
        }

        // 반복 작업을 타입에 따라 콜백으로 처리
        const extendedProcess = (kind) => {

            const typeMapCallback = {
                qwerty: Utils.qwertyToDubeol, antispoof: Utils.antispoof, pronounce: Utils.engToKo
            };
            const keyNameList = ['Message', 'Found', 'Positions', 'KeyWord', 'Type', 'DoubleEnd', 'DoubleEndPositions'].map(x=>(kind+x));
            const ddKeyNameList = ['DdMessage', 'DdFound', 'DdPositions', 'DdKeyWord', 'DdType',
                'DdsMessage', 'DdsFound', 'DdsPositions', 'DdsKeyWord', 'DdsType'].map(x=>(kind+x));
            let processMap = typeMapCallback[kind](message, true);
            let orgMsg = Utils.parseMap(processMap).joinedMessage;
            let newMsg = Utils.parseMap(processMap).joinedParsedMessage;
            let curObject = this.find(newMsg, needMultipleCheck, splitCheck, isStrong, false);
            let positions = curObject.positions.map(x=> (Utils.originalPosition(processMap, x)));
            let newPositions =[], curFound = [], keyWord = [], type = [];
            for (let idx5 in positions) {
                if (!Utils.objectIn(positions[idx5], res.positions)) {
                    newPositions.push(positions[idx5]);
                    let curWord = positions[idx5].map(y => orgMsg[y]).join("");
                    curFound.push(curWord);
                    keyWord.push(curObject.keyWord[idx5]);
                    type.push(curObject.type[idx5]);
                }
                if (!needMultipleCheck && newPositions.length > 0) break;
            }

            let dePositions = curObject.doubleEndPositions.map(x=> (Utils.originalPosition(processMap, [Number(x)])))
            let newDePositions=[], deFound = [];
            for (let idx6 in dePositions) {
                if (!Utils.objectInclude(dePositions[idx6], curObject.doubleEndPositions)) {
                    newDePositions.push(dePositions[idx6]);
                    let deWord = dePositions[idx6].map(x=>newMsg[x]).join("");
                    deFound.push(deWord);
                }
            }
            // res 정의하기
            let newRes = {};
            newRes[keyNameList[0]] = newMsg;
            newRes[keyNameList[1]] = curFound;
            newRes[keyNameList[2]] = newPositions;
            newRes[keyNameList[3]] = keyWord;
            newRes[keyNameList[4]] = type;
            newRes[keyNameList[5]] = deFound;
            newRes[keyNameList[6]] = newDePositions;

            if (isStrong && (needMultipleCheck || newPositions.length===0)) {
                let curDdMsg = curObject.ddMessage;
                let curDdsMsg = curObject.ddsMessage;
                let ddPositions = curObject.ddPositions.map(x=> (Utils.originalPosition(processMap, x)));
                let newDdPositions = [], curDdFound=[], ddKeyWord = [], ddType = [];
                for (let idx7 in ddPositions) {
                    if (!Utils.objectIn(ddPositions[idx7], res.positions)) {
                        newDdPositions.push(ddPositions[idx7]);
                        let curDdWord = ddPositions[idx7].map(y=> orgMsg[y]).join("");
                        curDdFound.push(curDdWord);
                        ddKeyWord.push(curObject.ddKeyWord[idx7]);
                        ddType.push(curObject.ddType[idx7]);
                    }
                    if (!needMultipleCheck && newDdPositions.length>0) break;
                }
                let ddsPositions = curObject.ddsPositions.map(x=> (Utils.originalPosition(processMap, x)));
                let newDdsPositions = [], curDdsFound=[], ddsKeyWord = [], ddsType = [];
                if (needMultipleCheck || newDdPositions.length ===0) {
                    for (let idx8 in ddsPositions) {
                        if (!Utils.objectIn(ddsPositions[idx8], res.positions)) {
                            newDdsPositions.push(ddsPositions[idx8]);
                            let curDdsWord = ddsPositions[idx8].map(y=> orgMsg[y]).join("");
                            curDdsFound.push(curDdsWord);
                            ddsKeyWord.push(curObject.ddsKeyWord[idx8]);
                            ddsType.push(curObject.ddsType[idx8]);
                        }
                        if (!needMultipleCheck && newDdsPositions.length ===0 ) break;
                    }
                }

                newRes[ddKeyNameList[0]] = curDdMsg;
                newRes[ddKeyNameList[1]] = curDdFound;
                newRes[ddKeyNameList[2]] = newDdPositions;
                newRes[ddKeyNameList[3]] = ddKeyWord;
                newRes[ddKeyNameList[4]] = ddType;
                newRes[ddKeyNameList[5]] = curDdsMsg;
                newRes[ddKeyNameList[6]] = curDdsFound;
                newRes[ddKeyNameList[7]] = newDdsPositions;
                newRes[ddKeyNameList[8]] = ddsKeyWord;
                newRes[ddKeyNameList[9]] = ddsType;
            }
            return newRes;
        }


        // 우선 qwerty 변환 옵션이 켜졌을 때 찾을 수 있는지 확인
        if (this.checkOptions.indexOf('qwerty')>-1 && recursive) {

            let newRes = extendedProcess('qwerty');
            res = {...res, ...newRes}
        }

        // antispoof 변환 옵션이 켜졌을 때 잡을 수 있는지 확인
        if (this.checkOptions.indexOf('antispoof')>-1 && recursive) {
            let newRes = extendedProcess('antispoof');

            res = {...res, ...newRes}
        }

        // 발음 조건이 있을 때 잡을 수 있는지 확인
        if (this.checkOptions.indexOf('pronounce')>-1 && recursive) {

            let newRes = extendedProcess('pronounce');
            res = {...res, ...newRes}
        }

        return res;

    }

    // 메시지의 비속어를 콘솔창으로 띄워서 찾기.
    // message - 메시지(isMap이 false) 혹은 메시지 매핑(isMap이 true). needMultipleCheck
    nativeFind(message, needMultipleCheck, isMap = false, isReassemble = false, print=true,  parsedWordsList=null, parsedWordsMap = this.badWordsMap) {

        const wordTypeValue = {
            drug: "약물", etc:"", insult:"모욕적", sexuality:"성적", violence:"폭력적"
        }

        let foundBadWords = []; // 찾은 비속어 단어 결과.
        let foundBadWordTypes = []; // 찾은 비속어 단어 유형
        let foundBadWordPositions = [] // 찾은 비속어 단어의 원래 위치
        let originalFoundBadWords = []; // map으로 주어졌을 때 원래 단어.
        let originalFoundBadWordPositions = []; // isMap에서 original 단어 위치
        let originalMessageList = []; // isMap 사용시 원래 메시지에서 parseMap으로 유도되는 메시지 목록
        let originalMessageSyllablePositions = []; // isMap 사용시 원래 메시지에 parseMap으로 유도되는 메시지의 위치 정보

        // Map으로 주어지면 newMessage에 대해 찾는다.
        let originalMessage = ""; // isMap일 때 매핑의 원문 정보.
        let newMessage =""; // isMap일 때는 매핑에 의해 변환된 메시지.

        if (isMap) {
            // 맵을 파싱해서 찾아보자.
            originalMessageList = Utils.parseMap(message).messageList;
            originalMessage = Utils.parseMap(message).joinedMessage;
            // dropDouble일 때에는 바ㅂ오 ->밥오로 환원하기 위해 originalMessage를 한글 조합으로
            originalMessage = isReassemble ? Utils.assembleHangul(originalMessage, false): originalMessage;
            originalMessageSyllablePositions =  Utils.parseMap(message).messageIndex;
            newMessage = Utils.parseMap(message).joinedParsedMessage;
        }
        else {
            newMessage = message;
        }

        // 찾은 정상단어의 포지션을 찾습니다.
        // 형식 : [[1,2,3], [4,5,6],...]
        let normalWordPositions = this.findNormalWordPositions(newMessage, false)

        // 매핑 사용하기
        let parsedBadWords;
        let parsedBadWordsMap = parsedWordsMap;

        // 단순 단어 리스트일 때 -> wordArray 사용
        if (Array.isArray(parsedWordsList) && typeof parsedWordsList[0] === "string") {
            let parsedMapList = Utils.parseFromList(parsedWordsList);
            parsedBadWords = parsedMapList[0];
            parsedWordsList = parsedMapList[1];
            if(Object.keys(parsedBadWordsMap).length ===0) {
                for (var word of parsedWordsList) {
                    parsedBadWordsMap[word] = 'etc';
                }
            }
        }
        // 낱자로 구별된 리스트일 때
        else if (Array.isArray(parsedWordsList) && Array.isArray(parsedWordsList[0]) && typeof parsedWordsList[0][0]==="string") {
            let parsedMapList = Utils.parseFromList(parsedWordsList.map(x=>x.join('')));
            parsedBadWords = parsedMapList[0];
            parsedWordsList = parsedMapList[1];
            if (Object.keys(parsedBadWordsMap).length ===0) {
                for (var word of parsedWordsList) {
                    parsedBadWordsMap[word] = 'etc';
                }
            }
        }
        // 나머지 경우 -
        else {
            parsedBadWords = this.parsedBadWords;
            // parsedBadWordsMap = this.badWordsMap;
        }

        // 비속어 단어를 한 단어씩 순회합니다. parsedBadWords의 idx를 사용해 보자.
        for (let idx in parsedBadWords) {

            let badWord = parsedBadWords[idx]; // badWord -> parsedBadWords 기준
            let badWordValue = badWord.join(""); // badWordValue -> 단어 붙이기.

            // 단순히 찾는 것으로 정보를 수집하는 것이 아닌 위치를 아예 수집해보자.
            let findLetterPosition = {}; // findLetterPosition 형태 : {시: [1,8], 발:[2,7,12]}등
            let badWordPositions = []; // 나쁜 단어 수집 형태. 이 경우는 [[1,2], [8,7]]로 수집된다.
            let wordType = parsedBadWordsMap[badWordValue]; // 단어 타입.
            if(!wordType) continue; // 단어 체크가 안될 때는 넘어간다.
            let isInit = false; // 시작글자 확인
            let fixedOrder = false; // 순서 고정여부 확인

            // 비속어 단어를 한 글자씩 순회하며 존재여부를 검사합니다.
            for (let pos in badWord) {
                let character = badWord[pos];

                // badWord가 isInit인지 확인할 것
                if (Number(pos) === 0 && character[0] === "^") {
                    isInit = true;
                }
                character = isInit && Number(pos)===0 ? character.slice(1): character; //
                let mainCharacter = character[0] // 핵심 글자.
                let parserCharacter = ['!', '+', '$'].indexOf(character[1])>-1 ? character[1]: '' // !, + 또는 $

                // 뒤의 낱자 수집
                let nextCharacter = (Number(pos) < badWord.length-1)
                    ? badWord[ Number(pos)+1 ][0].toLowerCase(): "" // 뒤의 낱자 수집.

                let badOneCharacter = String(mainCharacter).toLowerCase(); // 소문자로 통일합니다.

                // 일단 비속어 단어의 리스트를 정의해서 수집한다.
                findLetterPosition[badOneCharacter] = [] // 리스트

                // 비속어 단어의 글자위치를 수집합니다.
                // 메시지 글자를 모두 반복합니다.
                for (let index in newMessage) {

                    // 단어 한글자라도 들어가 있으면 찾은 글자를 기록합니다.
                    let unsafeOneCharacter = String(newMessage[index]).toLowerCase()


                    // parserCharacter가 !이면 유사문자를 활용하는 함수인 isKindChar 활용
                    if (parserCharacter==="!") {
                        if (Utils.isKindChar(unsafeOneCharacter, badOneCharacter, nextCharacter)) {
                            findLetterPosition[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문장에서 전부 수집한다.
                        }
                    }
                    // parserCharacter가 +이면 unsafeOneCharacter가 badOneCharacter의 자모를 모두 포함하는지 확인.
                    else if (parserCharacter === "+") {
                        if ( Utils.isInChar(unsafeOneCharacter, badOneCharacter) ) {
                            findLetterPosition[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문장에서 전부 수집한다.
                        }
                    }
                    // parsedCharacter가 $이면 fixedOrder true 지정
                    else if (parserCharacter === '$') fixedOrder = true;

                    // 나머지 경우 - 문자가 동일할 때에만 수집.
                    else {
                        if (badOneCharacter === unsafeOneCharacter) {
                            findLetterPosition[badOneCharacter].push(Number(index)) // 하나만 수집하지 않고 문단에서 전부 수집한다.
                        }
                    }

                }
            }

            // 이제 badWord를 찾아보자. 어떻게? findCount에서...

            // 단어 포지션 리스트 곱으로 수집한다.
            let positionVectorList = Object.values(findLetterPosition);
            let possiblePositions = Utils.productList(...positionVectorList);

            // badWord의 원래 포지션 찾기
            let badWordOriginalPositions = [];
            let originalBadWords = [];

            // 비속어에서 가능한 글자조합 모두 검사하기
            for (let position of possiblePositions) {

                // 단어 첫글자의 위치 잡기
                let tempBadWordPositions = JSON.parse(JSON.stringify(position)); // 복사. 다만 wordPosition과 안 겹치게

                // 넘어갈 필요가 있는지 확인해보기
                let isNeedToPass = false;
                // 순서가 바뀌었는지도 체크해보자.
                let isShuffled = false

                // 정상단어와 체크. 비속어 wordPosition이 정상단어의 위치값에 완벽히 들어가면 넘어간다.
                for (var normalList of normalWordPositions) {
                    if (Utils.objectInclude(tempBadWordPositions, normalList, false)) {
                        isNeedToPass = true; break;
                    }
                }

                // 포지션 체크. 단어에서 뒤에 올 글자가 앞에 올 글자랑 같은 포지션을 점거하거나 3글자 이상 앞에 오면 isNeedToPass를 띄운다.
                // 이유 : 단어의 낱자는 모두 다른 위치에 있어야 한다.
                for (var pos =0; pos<position.length; pos++) {
                    if (!isNeedToPass) {
                        for (var pos1 =0; pos1<pos; pos1++) {
                            if (position[pos1] - position[pos]<=-3 || position[pos1] === position[pos]) {
                                isNeedToPass = true; break;
                            }
                        }
                    }
                    if (isNeedToPass) break;
                }

                // 기존에 찾은 비속어에 완벽히 포함되는지 확인할 것. 포함되면 Pass 띄운다
                // foundBadWordPositions => 단어 기준 [ [4,6], [10,12],...], []
                for (let posLists of foundBadWordPositions) {
                    if (!isNeedToPass) {
                        for (let posList of posLists) {
                            if (Utils.objectInclude(tempBadWordPositions, posList, false)) {
                                isNeedToPass = true; break;
                            }
                        }
                    }
                    if (isNeedToPass) break;
                }

                // tempBadWordPositions 순서 지정.
                let sortedPosition = tempBadWordPositions.slice().sort((a, b) => a - b);

                // isInit이 true일 때에는 init 글자가 단어의 맨 처음에 오는 것을 보장해야 한다.
                // sortedPosition[0]과 tempBadWordPosition[0]이 일치하지 않으면서 tempBadWordPosition[0]의 앞단어가 공백이 아니면
                // isNeedToPass를 띄운다.
                if (isInit) {
                    if (sortedPosition[0] !== tempBadWordPositions[0]) isNeedToPass = true;
                    else if (tempBadWordPositions[0]>0 && !/^\s$/.test(newMessage[tempBadWordPositions[0]-1]))
                        isNeedToPass = true;
                }

                // 포지션을 순서대로 정렬했는데 순서가 달라진다면 글자가 섞여있는 것으로 간주합니다.
                if( !Utils.objectEqual(sortedPosition, tempBadWordPositions) ){
                    isShuffled = true;
                    tempBadWordPositions = sortedPosition; // 순서대로 정렬한 값을 추출한다.
                }

                // fixedOrder가 참일 때 섞여 있으면 isNeedToPass를 띄운다.
                isNeedToPass = isNeedToPass || (isShuffled && fixedOrder);

                // TODO
                // 발견된 각 문자 사이의 거리 및 사람이 인식할 가능성 거리의 계산
                // (3글자가 각각 떨어져 있을 수도 있음)
                // 글자간 사이들을 순회하여서 해당 비속어가 사람이 인식하지 못할 정도로 퍼져있다거나 섞여있는지를 확인합니다.

                let positionInterval = Utils.grabCouple(tempBadWordPositions); // [1,3,4]-> [[1,3], [3,4]]

                // 각 글자 인덱스 구간을 수집한다.
                for(let diffRangeIndex in positionInterval){

                    // 글자간 사이에 있는 모든 글자를 순회합니다.
                    let diff = ''
                    for(let diffi = positionInterval[diffRangeIndex][0]+1; diffi <= (positionInterval[diffRangeIndex][1]-1); diffi++){
                        diff += newMessage[diffi]
                    }

                    if(isShuffled && !isNeedToPass){
                        // 뒤집힌 단어의 경우엔 자음과 모음이 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.
                        if(!this.shuffledMessageFilter(diff, false, true))
                            isNeedToPass = true
                    }
                    else {
                        // 순서가 뒤집히지 않았을 때는 한글의 길이가 충분히 길거나 정상단어가 글자 사이에 쓰인 경우 비속어에서 배제합니다.
                        if (this.shuffledMessageFilter(diff,true, true)>3) isNeedToPass = true;
                        else {
                            for (let index in this.normalWords) {
                                if (diff.length === 0) break
                                let diffSearchedPositions = Utils.getPositionAll(diff, this.normalWords[index])
                                if (diffSearchedPositions.length > 1) {
                                    isNeedToPass = true;
                                }
                            }
                        }
                    }
                }

                // 해당 비속어를 발견은 하였지만,사람이 인지하지 못할 것으로 간주되는 경우 해당 발견된 비속어를 무시합니다.
                if(isNeedToPass) continue

                // 모든 조건 통과할 경우 badWordPositions에 추가
                badWordPositions.push(tempBadWordPositions);

                // 원래 위치 찾기

                let tempBadWordOriginalPositions = [];

                // map일 때는 메시지 더 찾기
                if (isMap) {
                    // 포지션 벡터 찾기
                    tempBadWordOriginalPositions = Utils.originalPosition(message, tempBadWordPositions);

                    // 원문의 단어 찾기
                    let originalBadWord = originalMessage.split("").filter((val, idx)=> tempBadWordOriginalPositions.indexOf(idx)>-1).join("");

                    // 원소 넣기.
                    badWordOriginalPositions.push(tempBadWordOriginalPositions);
                    originalBadWords.push(originalBadWord);
                }


            }

            if (badWordPositions.length>0) {

                if (isMap) {
                    if (print) {
                        console.log(`원문: ${originalMessage}`);
                        console.log(`변환된 문장: ${newMessage}`);
                        console.log(`발견된 비속어: [${badWord.join()}]`)
                        console.log(`발견된 비속어 유형: ${wordTypeValue[wordType]}`)
                        console.log(`발견된 비속어 원문: [${originalBadWords}]`)
                        console.log(`발견된 비속어 위치: [${badWordPositions}]`)
                        console.log(`발견된 비속어 원래 위치: [${badWordOriginalPositions}]`)
                        console.log('\n')
                    }
                    foundBadWords.push(badWord.join(''))
                    foundBadWordTypes.push(wordTypeValue[wordType])
                    foundBadWordPositions.push(badWordPositions)
                    originalFoundBadWords.push(originalBadWords);
                    originalFoundBadWordPositions.push(badWordOriginalPositions);
                }
                else {
                    if (print) {
                        console.log(`원문: ${newMessage}`)
                        console.log(`발견된 비속어: [${badWord.join()}]`)
                        console.log(`발견된 비속어 유형: ${wordTypeValue[wordType]}`)
                        console.log(`발견된 비속어 위치: [${badWordPositions}]`)
                        console.log('\n')
                    }
                    foundBadWords.push(badWord.join(''))
                    foundBadWordTypes.push(wordTypeValue[wordType])
                    foundBadWordPositions.push(badWordPositions)
                }

            }
            // 반복 줄이기 위해 강제 탈출.
            if (needMultipleCheck === false && foundBadWords.length>0) break;
        }

        //부적절하게 겹받침 많이 사용했는지 여부 확인하기
        let tooMuchDouble;

        // 일단 잡아내기
        let doubleEndPos = Utils.tooMuchDoubleEnd(newMessage).pos;
        let doubleEndTxt = Utils.tooMuchDoubleEnd(newMessage).txt;

        // 우선 정상단어 포지션에서는 제거한다.
        let normalWordPositionsInSentence = Utils.listUnion(...normalWordPositions);
        for (var x of normalWordPositionsInSentence) {
            if (doubleEndPos.indexOf(Number(x))>-1) {
                let pos = doubleEndPos.indexOf(Number(x));
                doubleEndPos.splice(pos, 1);
                doubleEndTxt.splice(pos, 1);
            }
        }

        // 최종적으로 결과 찾기.

        tooMuchDouble = (doubleEndPos.length* 3>= newMessage.length)
            ? { pos: doubleEndPos, txt: doubleEndTxt} : {pos: [], txt: []};

        let isMapAdded = {};
        if (isMap) {
            isMapAdded = {
                originalFound: needMultipleCheck ? originalFoundBadWords : originalFoundBadWords.slice(0).slice(0),
                originalPositions: needMultipleCheck ? originalFoundBadWordPositions : originalFoundBadWordPositions.slice(0).slice(0),
            };
        }

        // 결과 출력
        return {
            found: needMultipleCheck? foundBadWords : foundBadWords.slice(0),
            type: needMultipleCheck? foundBadWordTypes: foundBadWordTypes.slice(0),
            positions: needMultipleCheck? foundBadWordPositions : foundBadWordPositions.slice(0).slice(0),
            //부적절하게 겹자음 받침을 많이 사용한 단어 적발.
            tooMuchDoubleEnd: tooMuchDouble,
            ...isMapAdded
        }
    }


    // 비속어를 결자처리하는 함수. isMap을 통해 유도해보자.
    // isMap 옵션 추가 -> message가 Map으로 주어질 경우 원문에서 출력함.
    fix(message, replaceCharacter='*', isMap=false) {

        let newMessage = isMap ? Utils.parseMap(message).joinedParsedMessage : message; // 오류 찾아낼 메시지
        let fixedMessageList = isMap ? JSON.parse(JSON.stringify(Utils.parseMap(message).messageList)) : message.split(""); // 고칠 메시지 리스트.

        let fixedMessageObject = this.find(newMessage, true, 20, this.dropDoubleCheck);
        let allPositions = this.dropDoubleCheck
            ? [...fixedMessageObject.positions, ...fixedMessageObject.ddPositions, ...fixedMessageObject.ddsPositions, fixedMessageObject.doubleEndPositions]
            : [...fixedMessageObject.positions, fixedMessageObject.doubleEndPositions];
        allPositions = allPositions.slice(-1)[0].length === 0 ? allPositions.slice(0, -1) : allPositions; // 마지막 열 길이가 0이면 비우기;

        // qwerty가 있을 때
        if (this.checkOptions.indexOf('qwerty') > -1) {
            allPositions = this.dropDoubleCheck
                ? [...allPositions, ...fixedMessageObject.qwertyPositions, ...fixedMessageObject.qwertyDdPositions, ...fixedMessageObject.qwertyDdsPositions, fixedMessageObject.qwertyDoubleEndPositions]
                : [...allPositions, ...fixedMessageObject.qwertyPositions, fixedMessageObject.qwertyDoubleEndPositions];
            allPositions = allPositions.slice(-1)[0].length === 0 ? allPositions.slice(0, -1) : allPositions; // 마지막 열 길이가 0이면 비우기;
        }
        // antispoof가 있을 때
        if (this.checkOptions.indexOf('antispoof') > -1) {
            allPositions = this.dropDoubleCheck
                ? [...allPositions, ...fixedMessageObject.antispoofPositions, ...fixedMessageObject.antispoofDdPositions, ...fixedMessageObject.antispoofDdsPositions, fixedMessageObject.antispoofDoubleEndPositions]
                : [...allPositions, ...fixedMessageObject.antispoofPositions, fixedMessageObject.antispoofDoubleEndPositions];
            allPositions = allPositions.slice(-1)[0].length === 0 ? allPositions.slice(0, -1) : allPositions; // 마지막 열 길이가 0이면 비우기;
        }
        // pronounce가 있을 때
        if (this.checkOptions.indexOf('pronounce') > -1) {
            allPositions = this.dropDoubleCheck
                ? [...allPositions, ...fixedMessageObject.pronouncePositions, ...fixedMessageObject.pronounceDdPositions, ...fixedMessageObject.pronounceDdsPositions, fixedMessageObject.pronounceDoubleEndPositions]
                : [...allPositions, ...fixedMessageObject.pronouncePositions, fixedMessageObject.pronounceDoubleEndPositions];
            allPositions = allPositions.slice(-1)[0].length === 0 ? allPositions.slice(0, -1) : allPositions; // 마지막 열 길이가 0이면 비우기;
        }

        // 대체문자
        replaceCharacter = (replaceCharacter === undefined) ? '*' : replaceCharacter

        // fixedMessage에서 찾기
        for (let index in fixedMessageList) {

            for (let positions of allPositions) {
                // object에서 position이 발견되는 경우 대체한다.
                if (positions.indexOf(parseInt(index)) !== -1) {
                    let curChar = fixedMessageList[index];
                    let preChar = index >0 ?fixedMessageList[Number(index)-1] : ''; // 앞 부분
                    if (/[ㄱ-ㅎ]/.test(curChar[0]) && Utils.assembleHangul(preChar+curChar).length === (preChar+curChar).length) {
                        fixedMessageList[index] = fixedMessageList[index].slice(1); // 자음으로 시작하면서 앞글자와 한글 조합시 길이가 보존되는 경우
                    }
                    fixedMessageList[index] = fixedMessageList[index].replace(/\S/g, replaceCharacter);
                    break;
                }
            }
        }

        if (isMap) {
            let newMessage = ''
            for (var idx in fixedMessageList) {
                // 앞의 글자가 한글이 아닐 경우 자음+한글 패턴의 앞 자음을 지운다.
                if (Number(idx) > 0 && !/[가-힣]/.test(fixedMessageList[Number(idx) - 1].slice(-1)[0])) {
                    fixedMessageList[idx] = fixedMessageList[idx].replace(/^([ㄱ-ㅎ])?(.*)$/, '$2');
                }
                newMessage = Hangul.assemble(Hangul.disassemble(newMessage + fixedMessageList[idx]));
            }
            return newMessage;
        } else return fixedMessageList.join("");
    }


    // 메시지에서 정상단어 위치 찾는 맵
    // isMap 형식일 경우 {정상단어: [[정상단어포지션1], [정상단어포지션2],...],... } 형식으로 출력
    // isMap 형식이 아니면 message에서 정상단어의 낱자의 위치 리스트 형식으로 출력.
    findNormalWordPositions (message, showMap = true) {
        let exceptNormalPositions = {} // 단어별로 위치 찾기

        // 우선 단어별로 exceptNormalPosition 찾기
        for (let exceptWord of this.exceptWords) {
            exceptNormalPositions[exceptWord] = Utils.getPositionAll(message, exceptWord, true, true)
        }

        let wordPositionMap = {}

        // 정상단어 포지션 찾기
        for (let normalWord of this.normalWords) {
            let normalWordInitPos = Utils.getPositionAll(message, normalWord, false); // 정상단어 초기 위치 찾기
            let newNormalWordList = [];
            for (let x in normalWordInitPos) {
                let isIn = true;
                let initPos = Number(normalWordInitPos[x]); //정상단어의 첫 시작 위치
                let normalWordPos = Array.from(Array(normalWord.length).keys()).map(z => z+Number(initPos)); // 정상단어의 위치
                for (let exceptWord in exceptNormalPositions) {
                    let range = exceptNormalPositions[exceptWord]; //정상단어 예외처리 범위 리스트
                    if (Utils.objectInclude(normalWordPos, range)) {
                        isIn = false; break; // 찾은 정상단어가 특정 정상단어 예외단어의 인덱스 안에 들어가버리면 정상단어로 취급하지 않는다.
                    }
                }
                if (isIn) {newNormalWordList.push(normalWordPos)}
            }

            // 단어가 들어갔을 때 저장.
            if (newNormalWordList.length>0) wordPositionMap[normalWord] = newNormalWordList
        }

        // showMap일 때에는 {단어:[[위치1], [위치2],....], ...} 형식으로 출력
        if (showMap) return wordPositionMap;
        else {
            let wordPositionMapList = Object.values(wordPositionMap);
            return Utils.listUnion(...wordPositionMapList);
        }

    }

    // 어떤 단어가 비속어 목록에 포함된지 체크
    isExistNormalWord(word) {
        return (typeof(this.normalWordsMap[word]) != 'undefined')
    }

    // 비속어 여부 파악하기
    isExistBadWord(word) {
        return (typeof(this.badWordsMap[word]) != 'undefined')
    }

    // 뒤집힌 단어의 경우엔 자음과 모음이 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.-
    shuffledMessageFilter(message, isCount = false, isChar = false) {
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
                    else if (/^[,.!?:;"'&\-()0-9]$/.test(char)) {
                        continue;
                    }
                    // 다른 문자는 그냥 영단어 숫자 초기화.
                    else { tempCnt = 0; }
                }
            }
        }
        return isCount?cnt:(cnt === 0);
    }


    // 비속어 검사시 영어표현의 위치를 잡아내는 함수
    // 예시 : ([[지!,'랄'], ziral) =>[0,1,2,3,4] )
    // isMap일 때에는 {position: [], originalPosition: []} 형태로 출력
    // type :
    engBadWordsCheck(wordList, message, type, isMap=false) {
        let res = [] // 리스트 형태로 출력. 각 원소는 [1,2,4] 형식으로 출력함.
        let originalRes = [] // 원문의 위치 리스트 형태로 출력. isMap이 참일 때만 사용 가능
        let messageParse = isMap ? Utils.parseMap(message) : {messageList:[], messageIndex: [], parsedMessage:[], joinedMessage:'', joinedParsedMessage: '' }
        let newMessage= isMap? Utils.assembleHangul(messageParse.joinedParsedMessage, false): message; // 결과 메시지
        let msgMap;

        // 반복되는 프로세스를 callback으로 정리
        const joinProcess = (msgMap) => {
            let wordResult = this.nativeFind(msgMap,true, true, true, false, wordList, this.badWordsMap);
            console.log(this.badWordsMap['지!랄']);
            console.log(wordResult);
            if (wordResult.originalPositions[0].length > 0) {
                res = res.concat(wordResult.originalPositions[0]);
                // isMap일 때는 modRes를 이용해서 수정된 위치를 잡은 뒤 originalPosition으로 원본 위치 잡아내기
                if (isMap) {
                    let modRes = wordResult.originalPositions[0];
                    for (let position of modRes) {
                        let originalPosition = Utils.originalPosition(message, position);
                        originalRes.push(originalPosition);
                    }
                }
            }

        }

        // 타입에 따라 작업 달라짐
        switch(type) {
            // 한영자 타입 섞기 테스트
            case 'qwerty':
                msgMap = Utils.qwertyToDubeol(newMessage, true);
                joinProcess(msgMap);
                break;
            //
            case 'antispoof':
                msgMap = Utils.antispoof(newMessage, true);
                joinProcess(msgMap);
                break;
            case 'pronounce':
                msgMap = Utils.engToKo(newMessage, true);
                joinProcess(msgMap);
                break;
        }

        return isMap? {position: res, originalPosition: originalRes}: res;
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
    recursiveComponent (data, variable={}, nonParsedVariable = null) {
        // data : array.
        // 오류 방지를 위해 데이터 조작 부분은 deep-copy로 전환
        let newData = JSON.parse(JSON.stringify(data))

        // console.log('recursiveComponent() start')

        // 데이터의 전항 후항을 순회합니다.
        for(let i=0;i<=1;i++){

            // 데이터의 모든 항목을 순회합니다.
            for(let itemIndex in newData[i]){
                let item = newData[i][itemIndex]

                // console.log("item LIST:::", item)

                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                if(Array.isArray(item)){
                    let solvedData = this.recursiveComponent(item, variable, nonParsedVariable)
                    // console.log("SOLVEDDATA", solvedData)
                    newData[i][itemIndex] = null
                    newData[i] = newData[i].concat(solvedData)
                    // data[i] = Utils.assembleHangul(data[i])

                } else if(!Array.isArray(item) && typeof item === 'object'){

                    // 부가 함수를 사용한 경우
                    // 지정된 함수가 반환하는 리스트를 반영합니다.
                    newData[i] = newData[i].concat(this.recursiveComponent(item, variable, nonParsedVariable))
                    // data[i] = Utils.assembleHangul(data[i])

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

                        newData[i] = newData[i].concat(variable[varName])
                        // data[i] = Utils.assembleHangul(data[i])
                    }
                    // 아니면 nonParsedVariable에서 변수가 있는지 확인해보기.
                    else {
                        //  console.log(`2함수호출됨: ${varName}`)
                        // 만약 변수 안에서 변수를 참조한 경우
                        // 필요한 부분의 변수만 파싱하여 해당 리스트를 구성합니다.
                        if(nonParsedVariable !== null){
                            //   console.log(`2함수진행됨: ${varName}`)
                            let parsedHeaderVariable = this.recursiveList(nonParsedVariable[varName], nonParsedVariable, true)
                            newData[i] = newData[i].concat(parsedHeaderVariable)
                            // data[i] = Utils.assembleHangul(data[i])
                            //  console.log(`2함수결과:`)
                            //  console.log(parsedHeaderVariable.length)
                            if(parsedHeaderVariable.length == 0)
                                throw new Error (`${varName} 변수를 찾을 수 없습니다. 또는 변수 내부 길이가 0입니다.`)
                        }else{
                            throw new Error (`nonParsedVariable 전해받지 못함, ${varName} 변수를 찾을 수 없습니다.`)
                        }
                    }
                    newData[i][itemIndex] = null
                }
            }
        }

        // 데이터의 전항 후항을 순회합니다.
        let solvedData = []
        for(let before of newData[0]){
            if(before === null) continue
            for(let after of newData[1]){
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

    recursiveList (list, variable = null, isVariableParse = false, defaultType = 'string') {
        // console.log('recursiveList() start')

        // 수정 - 입력값이 바뀌는 현상이 발생해서 deep-copy로 바꾸어보자.
        let newList = JSON.parse(JSON.stringify(list));

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
        for(let itemIndex in newList){
            // console.log("ITEMINDEX:::", list[itemIndex])
            let item = newList[itemIndex]

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
                        // rebuild = Utils.assembleHangul(rebuild)
                    }else{
                        if(isVariableParse){

                            // 정의된 변수가 없는데 변수가 들어갔으면
                            // 해당 변수만 별개로 해석하여 리스트에 첨부합니다.
                            let parsedHeaderVariable = this.recursiveList(variable[varName], variable, true)
                            // console.log("\n\nParsedHeaderVariable", parsedHeaderVariable)
                            rebuild = rebuild.concat(parsedHeaderVariable)
                            // rebuild = Utils.assembleHangul(rebuild)
                        }else{
                            throw new Error(`${varName} 음절 변수를 찾을 수 없습니다.`)
                        }
                    }
                }

            }else if(Array.isArray(item) && typeof item === 'object'){

                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                rebuild = rebuild.concat(this.recursiveComponent(item, parsedVaraible, variable))
                // rebuild = Utils.assembleHangul(rebuild)
            }else{

                // 부가 함수를 사용한 경우
                // 지정된 함수가 반환하는 리스트를 반영합니다.
                rebuild = rebuild.concat(this.additionalType(item, parsedVaraible, variable))
                // rebuild = Utils.assembleHangul(rebuild)
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
    additionalType(component, parsedVaraible, nonParsedVariable = null){
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
};

module.exports = Tetrapod;
