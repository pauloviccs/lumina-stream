import fs from 'fs';

const url = 'https://multicanaishd.best/canal/big-brother-brasil-26/';

async function test() {
    try {
        const proxy1 = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        console.log('Testing allorigins...');
        let res = await fetch(proxy1, { signal: AbortSignal.timeout(5000) });
        let data = await res.json();
        console.log('allorigins success length: ', data.contents?.length);
    } catch (e) {
        console.log(`Failed allorigins: ${e.message}`);
    }

    try {
        const proxy2 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        console.log('Testing codetabs...');
        let res = await fetch(proxy2, { signal: AbortSignal.timeout(5000) });
        let text = await res.text();
        console.log('codetabs success length: ', text.length);
    } catch (e) {
        console.log(`Failed codetabs: ${e.message}`);
    }
}
test();
