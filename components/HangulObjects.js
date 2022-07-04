// 한글 용도로 추가

const charInitials= [
        'ㄱ', 'ㄲ','ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const charMedials = [
        'ㅏ', 'ㅐ' , 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];
const charSimpleMedials = [
        'ㅏ', 'ㅐ' , 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', , 'ㅣ'
];
const charFinals = [
        'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
        'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const charConsonants = [
        'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ',
        'ㅂ', 'ㅃ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

    // 이중 받침 자음
const doubleConsonant =  [
    ['ㄱ','ㅅ'], ['ㄴ','ㅈ'], ['ㄴ','ㅎ'], ['ㄹ','ㄱ'], ['ㄹ','ㅁ'], ['ㄹ','ㅂ'], ['ㄹ','ㅅ'],
    ['ㄹ','ㅌ'], ['ㄹ','ㅍ'], ['ㄹ','ㅎ'], ['ㅂ','ㅅ']
];

    // 이중 모음
const doubleVowel =  [
    ['ㅗ','ㅏ'], ['ㅗ','ㅐ'], ['ㅗ','ㅣ'], ['ㅜ','ㅓ'], ['ㅜ','ㅔ'], ['ㅜ','ㅣ'], ['ㅡ','ㅣ']
];

    // 치음
const toothConsonant = ["ㄷ", "ㄸ", "ㅅ", "ㅆ", "ㅈ", "ㅉ", "ㅊ"];

// 유사한 초성
const simInit =  {
        "ㄱ":["ㄲ", "ㅋ"], "ㄲ":['ㅋ'], "ㄷ":["ㄸ", "ㅌ", "ㅆ", "ㅉ"], "ㄸ":["ㅌ", "ㅉ"], "ㄹ":["ㄴ"], "ㅂ":["ㅃ", "ㅍ"], "ㅃ":["ㅍ"],
        "ㅅ":[ "ㄸ", "ㅆ", "ㅉ"], "ㅆ": ["ㅉ"], "ㅈ":["ㅆ", "ㅉ", "ㅊ"], "ㅉ":["ㅊ", "ㅆ"], "ㅊ":["ㅉ"], "ㅋ":["ㄲ"], "ㅌ":["ㄸ"], "ㅍ":["ㅃ"], "ㅎ":["ㅍ"]
    };

    // 유사한 중성
    // 유사중성.  고 -> 거, 교
const simMiddle =  {
        "ㅏ":[["ㅑ"], ["ㅗ", "ㅏ"]], "ㅐ":[["ㅒ"], ["ㅔ"], ["ㅖ"], ["ㅗ", "ㅐ"], ["ㅗ", "ㅣ"], ["ㅜ","ㅔ"]], "ㅒ":[["ㅖ"]],
        "ㅓ":[["ㅕ"], ["ㅜ", "ㅓ"], ["ㅗ"]], "ㅔ":[["ㅒ"], ["ㅔ"], ["ㅖ"], ["ㅗ", "ㅐ"], ["ㅗ", "ㅣ"], ["ㅜ","ㅔ"]], "ㅕ":[["ㅛ"]], "ㅖ":[["ㅖ"]],
        "ㅗ":[["ㅓ"], ["ㅛ"]], "ㅙ":[["ㅗ", "ㅣ"], ["ㅜ","ㅔ"]], "ㅚ":[["ㅗ", "ㅐ"], ["ㅜ","ㅔ"]], "ㅛ":[["ㅕ"]],
        "ㅜ":[["ㅠ"],["ㅡ"]], "ㅞ":[["ㅗ", "ㅐ"], ["ㅗ", "ㅣ"]], "ㅡ":[["ㅜ"]], "ㅣ":[["ㅜ","ㅣ"], ["ㅡ", "ㅣ"]]
    };

    // 치음일 때의 유사중성. 치음은 i 반모음을 무시한다.
const toothSimMiddle =  { ...simMiddle,
        "ㅑ":[["ㅏ"], ["ㅗ", "ㅏ"]], "ㅒ": [["ㅐ"], ["ㅔ"], ["ㅖ"], ["ㅗ", "ㅐ"], ["ㅗ", "ㅣ"], ["ㅜ","ㅔ"]],
        "ㅕ":[["ㅓ"], ["ㅜ","ㅓ"], ["ㅗ"], ["ㅛ"]], "ㅖ":[["ㅐ"], ["ㅔ"], ["ㅒ"], ["ㅗ", "ㅐ"], ["ㅗ", "ㅣ"], ["ㅜ","ㅔ"]],
        "ㅛ":[["ㅓ"], ["ㅕ"], ["ㅜ","ㅓ"], ["ㅗ"]], "ㅠ":[["ㅜ"], ["ㅡ"]]
    };

    // 유사종성
const simEnd= {
        "ㄱ": ["ㅋ", "ㄲ"], "ㄲ":["ㄱ", "ㅋ"], "ㄷ":["ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㅂ":["ㅂ", "ㅍ"], "ㅅ":["ㄷ", "ㅌ", "ㅆ", "ㅈ", "ㅊ"], "ㅆ":["ㄷ", "ㅌ", "ㅅ", "ㅈ", "ㅊ"],
        "ㅈ":["ㄷ", "ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㅊ":["ㄷ", "ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㅋ":["ㄱ", "ㄲ"], "ㅌ":["ㄷ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㅍ":["ㅂ", "ㅍ"], "ㅎ":["ㅅ"]
    };

    // 뒷글자에 의한 자음동화. 뒷글자가
const jointConsonant =  {
        "ㄱ":["ㄱ", "ㄲ", "ㅋ"], "ㄲ":["ㄱ", "ㅋ", "ㄲ"], "ㄴ":["ㄴ", "ㄷ", "ㅅ"], "ㄷ":["ㄷ", "ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㄸ":["ㄷ","ㅌ", "ㄸ", "ㅅ", "ㅆ", "ㅈ", "ㅊ" ], "ㄹ":["ㄴ", "ㄹ"],
        "ㅁ":["ㅁ", "ㅂ", "ㅍ"], "ㅂ":["ㅁ", "ㅂ", "ㅍ"], "ㅃ":["ㅁ", "ㅂ", "ㅃ"], "ㅅ":["ㅅ", "ㄷ", "ㅌ", "ㅆ", "ㅈ", "ㅊ"], "ㅆ":["ㄷ", "ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㅈ":["ㄷ", "ㅌ", "ㅅ", "ㅈ", "ㅆ", "ㅊ"],
        "ㅊ":["ㄷ", "ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ"], "ㅋ":["ㄱ", "ㄲ", "ㅋ"], "ㅌ":["ㄷ", "ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅌ"], "ㅍ":["ㅁ", "ㅂ", "ㅍ"], "ㅎ":["ㅎ"]
    };

const jointVowel = {
    "ㅏ":[["ㅐ"]], "ㅑ":[["ㅒ"], ["ㅖ"]], "ㅓ":[["ㅔ"]], "ㅕ":[["ㅒ"], ["ㅖ"]], "ㅗ":[["ㅗ", "ㅣ"]], "ㅜ":[["ㅜ", "ㅣ"]], "ㅡ":[["ㅡ", "ㅣ"]]
};


    // 두벌식 <->QWERTY 자판 호환. 한/영 키를 이용해서 욕설을 우회하는 것을 방지함.
const enKoKeyMapping = {
        'q':'ㅂ', 'Q':'ㅃ', 'w':'ㅈ', 'W':'ㅉ', 'e': 'ㄷ', 'E':'ㄸ', 'r':'ㄱ', 'R':'ㄲ', 't':'ㅅ', 'T':'ㅆ',
        'y':'ㅛ', 'Y':'ㅛ', 'u':'ㅕ', 'U':'ㅕ',  'i':'ㅑ', 'I': 'ㅑ', 'o': 'ㅐ', 'O': 'ㅒ', 'p':'ㅔ', 'P':'ㅖ',
        'a':'ㅁ', 'A':'ㅁ', 's':'ㄴ', 'S':'ㄴ', 'd': 'ㅇ', 'D':'ㅇ', 'f':'ㄹ', 'F': 'ㄹ', 'g': 'ㅎ', 'G':'ㅎ',
        'h':'ㅗ', 'H':'ㅗ', 'j':'ㅓ', 'J':'ㅓ', 'k':'ㅏ', 'K':'ㅏ', 'l':'ㅣ', 'L':'ㅣ',
        'z':'ㅋ', 'Z':'ㅋ', 'x':'ㅌ', 'X':'ㅌ', 'c':'ㅊ', 'C':'ㅊ', 'v':'ㅍ', 'V':'ㅍ',
        'b':'ㅠ', 'B':'ㅠ', 'n':'ㅜ', 'N':'ㅜ', 'm':'ㅡ', 'M':'ㅡ', '2':'ㅣ', '5':'ㅗ', '^':'ㅅ', '@':"ㅇ"
    };

    // 한영발음 메커니즘
const alphabetPronounceMapping = {
        // 메커니즘 - 우선 한/영 분리를 합니다. 그 다음에 한국어 비속어를 이용해서 영어 패턴을 생성합니다.
        consonants: {'ㄱ':['g','k', 'gg', 'kk'], 'ㄴ':['n'], 'ㄷ':['d', 't', 'dd','tt'], 'ㄹ':['l','r'], 'ㅁ':['m'], 'ㅂ':['b', 'p', 'bb', 'pp'], 'ㅅ':['s', 'sh', 'ss'], 'ㅇ':[''], 'ㅈ':['j','z', 'zz', 'jj', 'tch'],
            'ㅊ':['ch', 'jh', 'zh'], 'ㅋ':['k', 'kh', 'q'], 'ㅌ':['t', 'th'],'ㅍ':['p', 'ph'], 'ㅎ':['h']}, //쌍자음은 단자음으로 바꾸어서 전환 예정
        vowels : {'ㅏ':['a'], 'ㅐ':['ae', 'e'],  'ㅑ':['ya', 'ja'], 'ㅒ':['ye', 'yae'], 'ㅓ':['u', 'eo', 'eu'], 'ㅔ':['e', 'we'], 'ㅕ':['yu', 'yeo'], 'ㅖ':['ye'], 'ㅗ':['o', 'oh'], 'ㅘ':['wa', 'oa'],
            'ㅙ':['oe', 'oae', 'we', 'wae'], 'ㅚ':['oe', 'oi', 'we'], 'ㅛ':['yo'], 'ㅜ':['u', 'oo', 'uu'], 'ㅝ':['wu', 'weo'], 'ㅞ':['we', 'ue'], 'ㅟ':['ui', 'wi'], 'ㅠ':['yu', 'yoo'], 'ㅡ':['eu', '', 'u'], 'ㅢ':['eui', 'ui'], 'ㅣ':['i', 'ee']},
        endConsonants:{ 'ㄱ':['g','k'], 'ㄴ':['n', 'l'], 'ㄷ':['t','d'], 'ㄹ':['l'], 'ㅁ':['m'], 'ㅂ':['p','b','n'], 'ㅅ':['t', 's'], 'ㅇ':['ng', 'nn']},
    };

    //단일 발음에서 사용 - 추후 개선 예정
const singlePronounce =  {
        'C':'씨', 'c':'씨','十':'십', '+':'십', 'D':'디', 'd':'디', 'g':'지', 'z':'지', "M":'엠', 'm':'엠',
        'jot':'좆', 'wha':'화', 'emi':'에미', 'ebi':'에비', 'sip':'씹', "奀":"좆",
        'si':'시', 'ral':'랄', 'bal':'발', 'em':'엠', 'ba':'바', 'bo':'보','nom':'놈', 'nyeun':'년', 'byung':'병',
        '1':'일', '2':'이', '3':'삼', '4':'사', '5':'오', '6':'육', '7':'칠', '8':'팔', '9':'구', '0':'영'
};

    // 자모와 자형이 유사한 경우 사용
const similarConsonant= {
        '2':'ㄹ', '3':'ㅌ', "5":'ㄹ', '7':'ㄱ', '0':'ㅇ', 'C':'ㄷ', 'c':'ㄷ', 'D':'ㅁ', 'E':'ㅌ', "L":'ㄴ', 'M':'ㅆ', 'm':'ㅆ', 'n':'ㅅ', 'S':'ㄹ', 's':'ㄹ',
        'V':'ㅅ', 'v':'ㅅ', 'w':'ㅆ', 'W':'ㅆ', 'Z':'ㄹ', 'z':'ㄹ', '@':'ㅇ', '#':'ㅂ', '^':'ㅅ',
    };

    // 모음과 자형이 유사한 경우에 대비함
const similarVowel =  {
        '1':'ㅣ', 'H':'ㅐ', 'I':'ㅣ', 'l':'ㅣ', 'T':'ㅜ', 't':'ㅜ', 'y':'ㅓ', '!':'ㅣ',  '_':'ㅡ', '-':'ㅡ', '|':'ㅣ'
    };

    //자형이 유사한 단어들 모음. 추후 반영 예정
const similarShape = [
        ['ㄹ','근'], ['4', '니'], ['대', '머'], ['댁','먹'], ['댄', '먼'], ['댈', '멀'], ['댐', '멈'], ['댕', '멍'], ['金', '숲']
            ['奀', '좃', '좆'], ['長', '튼'], ['%', '응'], ['q', '이']
    ];



const HangulObjects = {
    charInitials,
    charMedials,
    charSimpleMedials,
    charFinals,
    charConsonants,
    doubleConsonant,
    doubleVowel,
    toothConsonant,
    simInit,
    simMiddle,
    toothSimMiddle,
    simEnd,
    jointConsonant,
    jointVowel,
    enKoKeyMapping,
    alphabetPronounceMapping,
    singlePronounce,
    similarConsonant,
    similarVowel,
    similarShape
};

module.exports = HangulObjects;
