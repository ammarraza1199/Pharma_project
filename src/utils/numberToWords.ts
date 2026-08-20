export function numberToWords(num: number): string {
  if (num === 0) return 'Rupees zero only';

  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function convertChunk(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convertChunk(n % 100) : '');
  }

  function convertInteger(n: number): string {
    if (n === 0) return 'zero';
    let result = '';

    const crore = Math.floor(n / 10000000);
    if (crore > 0) {
      result += convertChunk(crore) + ' crore ';
      n %= 10000000;
    }
    const lakh = Math.floor(n / 100000);
    if (lakh > 0) {
      result += convertChunk(lakh) + ' lakh ';
      n %= 100000;
    }
    const thousand = Math.floor(n / 1000);
    if (thousand > 0) {
      result += convertChunk(thousand) + ' thousand ';
      n %= 1000;
    }
    if (n > 0) {
      result += convertChunk(n);
    }
    return result.trim();
  }

  const parts = num.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let words = 'Rupees ' + convertInteger(integerPart);
  if (decimalPart > 0) {
    const digitWords = parts[1]
      .split('')
      .map(d => ones[parseInt(d, 10)] || 'zero')
      .join(' ');
    words += ' point ' + digitWords;
  }
  words += ' only';

  return words.charAt(0).toUpperCase() + words.slice(1);
}
