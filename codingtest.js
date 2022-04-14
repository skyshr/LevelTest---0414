var comb = require("combinations-generator");

// 1. 피보나치
function fibo(n) {
    let fiboArr = [0,1];
    if (n==1) return 0;
    if (n==2) return 1;
    for (let i = 0; i < n-2; i++) {
        let tmp = fiboArr[0] + fiboArr[1];
        fiboArr[0] = fiboArr[1];
        fiboArr[1] = tmp;
    }
    return fiboArr[1];
}
// console.log(fibo(1));
// console.log(fibo(2));
// console.log(fibo(3));
// console.log(fibo(4));
// console.log(fibo(5));
// console.log(fibo(6));
// console.log(fibo(7));
// console.log(fibo(8));
// console.log(fibo(9));
// console.log(fibo(10));

//2. 합산
function sum(absolutes, signs) {
    let result = 0;
    for (let index = 0; index < absolutes.length; index++) {
        if (signs[index]) result+= absolutes[index]
        else result -= absolutes[index]
    }
    return result
}

// console.log(sum([1,2,3], [false, false, true]));
// console.log(sum([1,2,3,4,4], [false, false, true, true, true]));

//3. 소수의 갯수
function primeCount(array) {
    function isPrime(n) {
        if (n==2 || n==3) return true
        if (n%2==0) return false
        for (let i = 3; i < parseInt(n/2) + 1; i+=2) {
            if (n%i==0) return false
        }
        return true
    }
    let iterator = comb(array,3);
    let result = [];
    for (let item of iterator){
        let sum = item[0] + item[1] + item[2];
        if (isPrime(sum)) {
            if (!result.includes(sum)) result.push(sum)
        }
    };
    return result.length
}

console.log(primeCount([1,2,3,4]));
console.log(primeCount([1,2,7,6,4]));
console.log(primeCount([1,2,3,4,5]));
