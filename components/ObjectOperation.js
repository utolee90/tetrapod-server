// 공용 오브젝트 조작하는 함수들 모았습니다.

const ObjectOperation = {

    // 배열/오브젝트 동일성 체크. 기능 확장.
    // 주의! 숫자, 문자열, 불리안만 원소로 구성된 리스트, 오브젝트만 비교 가능합니다. (함수 등의 원소는 비교 불가능)
    objectEqual: (a,b) => {
        if (typeof a !== typeof b) {
            return false;
        }
        else {
            if (typeof a === "string" || typeof a === "number" || typeof a === "boolean")
                return (a===b);
            // 타입이 달라도 패스
            else if (Array.isArray(a) !== Array.isArray(b)) {
                return false;
            }
            // 길이가 달라도 pass
            else if (Object.keys(a).length !== Object.keys(b).length ) {
                return false;
            }
            // 나머지 경우 - 원소 by 원소로 비교한다.
            else {
                for (let key in a) { // a의 키에 대해 조사. objectEqual로 동일 여부 비교
                    if (!b[key] || !ObjectOperation.objectEqual(a[key], b[key]) ) return false;
                }
            }
            return true;
        }

    },

    // 포함관계 정리 - elem이 object 안에 있는지 확인
    objectIn : (elem, object) => {
        // 우선 elem 파악
        if (typeof object === "object") {
            if (typeof elem === "string" || typeof elem ==="number" || typeof elem ==="boolean") {
                return Object.values(object).indexOf(elem)!==-1;
            }
            else if (typeof elem === "object") {
                for (let x in object) {
                    if (ObjectOperation.objectEqual(object[x], elem)) return true;
                }
            }
        }
        return false;
    },

    // 배열/오브젝트의 포함관계 체크. obj(a, b)에서  a가 b안에 들어갈 때 True
    objectInclude: (inc, exc, order=false) => {

        // 순서 생각하지 않고 포함관계
        if ( Array.isArray(inc) && Array.isArray(exc)) {
            if ( !order ) {
                // inc 안의 원소들에 대해서 exc안에 포함하기만 하면 OK
                for (let x of inc) {
                    if (!ObjectOperation.objectIn(x, exc))
                    {return false;}
                }
                // return false가 아니면 return true;
                return true;
            }
            // 순서 생각할 때에는 좀 다르게 전략을 짜보자. 우선
            else {
                // 임시 숫자
                let tempCnt =0; // 탈출하는 순간 false
                let tempVal = false;
                for (let incCnt=0; incCnt<inc.length; incCnt++) {
                    while(tempCnt<exc.length) {
                        if (inc[incCnt] === exc[tempCnt]) {
                            tempVal = true;
                            if (incCnt <inc.length-1) tempCnt++;
                            break;
                        }
                        else tempCnt++;
                    }
                    // tempCnt 최대값에 도달하면 자동 탈출
                    if (tempCnt === exc.length) {
                        tempVal = false;
                        break;
                    }
                }
                return tempVal;
            }

        }
        // 위의 작업 실행 못하면 거짓 출력.
        return false;

    },

    //리스트 안에 중복 원소 제거
    removeMultiple: (list) => {
        let res = [];
        for (let x of list) {
            if (!ObjectOperation.objectIn(x, res)) res.push(x);
        }
        return res;
    },

    // 리스트/함수 합성 등 여러 상황에서 합성할 때 사용함.
    joinMap: (lix, func) => {
        let res = {};

        // 문자 & 오브젝트 -> 단순 출력
        if (typeof lix ==="string" && typeof func === "object") return func[lix];

        // 문자 & 함수 -> 단순 함수값.
        else if (typeof lix === "string" && typeof func === "function") return func(lix);

        // 배열, 함수 형식 - 배열을 키로, 함수값을 값으로
        else if (Array.isArray(lix) && typeof func === "function") {
            lix.forEach(x=> {
                res[x] = func(x);
            });
            return res;
        }
        // 배열 & 오브젝트 -> 배열을 키로, 오브젝트 대응값을 값으로
        else if (Array.isArray(lix) && typeof func === "object" ) {
            lix.forEach(x=> {
                if (Object.keys(func).indexOf(x)!== -1) {
                    res[x] = func[x];
                }
            });
            return res;
        }
        // 오브젝트 둘 합성.
        else if (typeof lix === "object" && typeof func === "object" ) {
            Object.keys(lix).forEach(x=> {
                if (Object.keys(func).indexOf(lix[x])!== -1) {
                    res[x] = func[lix[x]];
                }
            });
            return res;
        }
        // 함수 둘 합성
        else if (typeof lix ==="function" && typeof func === "function") {
            return ((x) => {
                if (func(lix(x))) return func(lix(x));
                else return null;
            });
        }
    },

    // 리스트 그냥 더하기. 원소 형태는 모두 같아야 한다. [[1,2,3],[2,4,5]]=> [1,2,3,2,4,5]
    addList: (...list) => {
        // 숫자
        if (typeof list[0] === 'number') {
            let res =0;
            for (var x of list) {
                res += Number(x);
            }
            return res;
        }
        // 문자
        else if (typeof list[0] === 'string') {
            let res ='';
            for (var x of list) {
                res += x;
            }
            return res;
        }
        // 리스트
        else if (Array.isArray(list[0])) {
            let res = [];
            for (var x of list) {
                res = res.concat(x);
            }
            return res
        }

    },

    // 리스트를 곱하기. 예시  ([1,2,3],[4,5,6]) => [[1,4], [1,5], [1,6], [2,4], [2,5], [2,6], [3,4], [3,5], [3,6]]
    // 다른 함수들과 입력방식 통일해보자. (원소1, 원소2,...) 형태로 풀어쓰기를 기본으로 바꾸어보자.
    productList : (...list) => {

        if (list.length ===0) return [];
        // 1차원 배열일 때 => [1,2,3] => [[1],[2],[3]] 이런식으로 처리
        else if (list.length ===1 ) {
            if (Array.isArray(list[0]) && list[0].length>0) {
                return list[0].map(x=> [x])
            }
            else return [];
        }
        // 원소 2개일 때 -> [앞원소,뒷원소] 합치기
        else if (list.length ===2 ) {
            let res = [];
            for (let fe of list[0]) {
                for (let se of list[1]) {
                    res.push([fe, se]);
                }
            }
            return res;
        }
        // 원소 3개 이상이면 (앞의 원소들 productList)에 맨 뒷원소 곱하기 이용해보자.
        else {
            let res =[];
            let res0 = ObjectOperation.productList(...list.slice(0,-1)); // 앞부분까지 모두 곱해보자.
            if (res0.length ===0 || list.slice(-1)[0].length===0) return []; // 곱할 대상이 하나라도 비어있으면 빈 리스트 출력
            else {
                for (let fe of res0) {
                    for (let se of list.slice(-1)[0]) {
                        res.push([...fe, se]);
                    }
                }
                return res;
            }
        }

    },


    // 리스트 합집합 구하기. 리스트 원소가 일반이면 그냥 더하기, 오브젝트면 원소들을 union 하기
    listUnion : (...list) => {
        let res = []
        for (let x of list) {
            if (typeof x ==="string" || typeof x ==="number" || typeof x ==="boolean") {
                if (!ObjectOperation.objectIn(x, res )) res.push(x)
            }
            else if (typeof x === "object") {
                for (let y in x) {
                    if (!ObjectOperation.objectIn(x[y], res)) res.push(x[y])
                }
            }
        }
        return res;
    },

    // 리스트 교집합 구하기
    listIntersection: (...list) => {
        let res = []; // 빈 리스트 추가
        // 리스트 길이가 1일 때는 그냥 출력
        if (list.length === 1) {
            res = list[0];
        }
        // list 원소가 1보대 길면 반복작업 잡기
        else if (list.length > 1) {
            for (let elem of res[0]) { // 첫 번째 리스트의 원소에 대해서만 검사
                let isIntersected = true;
                for (let partList of list.slice(1)) {
                    isIntersected = ObjectOperation.objectIn(elem, partList);// 리스트에서 원소가 들어기는지 확인
                    if (!isIntersected) break;
                }
                if (isIntersected) res.push(elem);
            }
        }
        return res;
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
        return false
    },

    // 리스트 차집합 구하기 ori-diff
    listDifference: (a,b) => {
        let res = [];
        for (let x of a) {
            if (!Utils.objectIn(x, b)) res.push(x)
        }
        return res;
    },

    // 리스트에서 특정 타입만 필터링. type는 단순 문자열 혹은 리스트일 수 있음
    filterList: (list, type) => {
        let res = []
        // typeof 체크용
        const typeCheck = (x, checkType) => {
            if (['number', 'string', 'boolean', 'function', 'object', 'function', 'symbol', 'undefined'].indexOf(checkType) > -1) {
                return typeof x === checkType;
            } else if (['integer', 'int'].indexOf(checkType) > -1) return typeof x === 'number' && x === Math.floor(x);
            else if (['array', 'list'].indexOf(checkType) > -1) return Array.isArray(x);
            else if (['key', 'keyed', 'keyObject', 'dict'].indexOf(checkType) > -1) return (typeof x === 'object' && !Array.isArray(x));
            else return false;
        }

        if (typeof type === "string") {
            res = list.filter(x => (typeCheck(x, type)))
        }
        // 문자열의 리스트일 때는 원소들을 모두 union 해보자.
        else if (Array.isArray(type) && typeof type[0] === "string") {
            // type 리스트의 모든 원소에 타입체크 후 하나라도 true가 있으면 넣는다.
            res = list.filter(x => (type.map(y => typeCheck(x, y)).indexOf(true) > -1));
        }
        return res;
    }
};

module.exports = ObjectOperation;
