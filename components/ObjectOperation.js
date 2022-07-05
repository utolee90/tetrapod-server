// 공용 오브젝트 조작하는 함수들 모았습니다.

const ObjectOperation = {

    // 배열/오브젝트 동일성 체크. 기능 확장.
    objectEqual: (a,b) => {
        if (typeof a !== typeof b) {
            return false;
        }
        else {
            if (typeof a === "string" || typeof a === "number" || typeof a === "boolean")
                return (a===b);
            else if (Object.keys(a).length !== Object.keys(b).length ) {
                return false;
            }
            else {
                for (var key in a) { // a의 키에 대해 조사
                    if (a[key]!==b[key]) {return false;}
                }
            }
            return true;
        }

    },

    // 배열/오브젝트의 포함관계 체크. obj(a, b)에서  a가 b안에 들어갈 때 True
    objectInclude: (inc, exc, order=false) => {
        let val = true;
        // 순서 생각하지 않고 포함관계
        if ( Array.isArray(inc) && Array.isArray(exc)) {
            if ( !order ) {
                // inc 안의 원소들에 대해서 exc안에 포함하기만 하면 OK
                for (var x of inc) {
                    if (!ObjectOperation.objectIn(x, exc))
                    {val = false; break;}
                }

            }
            // 순서 생각할 때에는 좀 다르게 전략을 짜보자. 우선
            else {
                // 임시 숫자
                let tempCnt =0; // 탈출하는 순간 false
                let tempVal = false;
                for (var incCnt=0; incCnt<inc.length; incCnt++) {
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
                val = tempVal
            }

        }

        return val;

    },

    //중복 리스트 제거
    removeMultiple: (list) => {
        let res = [];
        for (var x of list) {
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
                for (var fele of list[0]) {
                    for (var sele of list[1]) {
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
                    for (fele of res0) {
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
                for (var x in object) {
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
        for (var x of list) {
            if (typeof x ==="string" || typeof x ==="number" || typeof x ==="boolean") {
                if (!ObjectOperation.objectIn(x, res )) res.push(x)
            }
            else if (typeof x === "object") {
                for (var y in x) {
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
            for (var y in list[0]) {
                let tmpRes = true;
                for (var x of list) {
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
