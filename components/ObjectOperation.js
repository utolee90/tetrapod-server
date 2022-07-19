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

    // 리스트를 곱하기. 예시  [[1,2,3],[4,5,6]] => [[1,4], [1,5], [1,6], [2,4], [2,5], [2,6], [3,4], [3,5], [3,6]]
    productList : (list) => {
        if (Array.isArray(list)) {
            if (list.length ===0) return [];
            else if (list.length ===1 ) {
                if (list[0].length>0) {
                    return list[0].map(x=> [x])
                }
                else return [];
            }
            else if (list.length ===2 ) {
                let res = [];
                for (let fele of list[0]) {
                    for (let sele of list[1]) {
                        res.push([fele, sele]);
                    }
                }
                return res;
            }
            else {
                let res =[];
                let res0 = ObjectOperation.productList(list.slice(0,-1));
                if (res0.length ===0 || list.slice(-1)[0].length===0) return [];
                else {
                    let fele;
                    for (fele of res0) {
                        let sele;
                        for (sele of list.slice(-1)[0]) {
                            res.push([...fele, sele]);
                        }
                    }
                    return res;
                }

            }
        }
        else {
            return null;
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
                return false;
            }
            else return false;
        }
        else return false;
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
        let res = [];
        if (list.length>0) {
            for (let y in list[0]) {
                let tmpRes = true;
                for (let x of list) {
                    tmpRes = tmpRes && ObjectOperation.objectIn(list[0][y], x)
                }
                if (tmpRes) res.push(list[0][y])
            }
            return res;
        }
        else return [];
    },
};

module.exports =  ObjectOperation;
