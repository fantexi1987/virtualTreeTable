export const simDeepClone = obj => {
    if (obj === null) return null;
    if (typeof obj === "object") {
        return JSON.parse(JSON.stringify(obj));
    } else if (typeof obj === "string") {
        try {
            return JSON.parse(obj);
        } catch (e) {
            console.error(e);
        }
    } else {
        return obj;
    }
}

export const highPerformanceFilter = (arr, func) => {
    let res = [];
    let arrLength = arr.length;
    // 经过调查，在小于10000或大于99999条数据的时候，for循环速度比filter速度会快7至8倍左右
    if (arrLength < 10000 || arrLength > 99999) {
        for (let a = 0; a < arrLength; a++) {
            if (func(arr[a])) {
                res.push(arr[a])
            }
        }
    } else {
        res = arr.filter(func);
    }
    return res
}

export const changeDateFun = (date) => {
    let y = date.getFullYear()
    let m = date.getMonth() + 1
    m = m < 10 ? ('0' + m) : m
    let d = date.getDate()
    d = d < 10 ? ('0' + d) : d
    let h =date.getHours()
    h = h < 10 ? ('0' + h) : h
    let M =date.getMinutes()
    M = M < 10 ? ('0' + M) : M
    let s =date.getSeconds()
    s = s < 10 ? ('0' + s) : s
    let dateTime= y + '-' + m + '-' + d + ' ' + h + ':' + M + ':' + s;
    return dateTime;
}