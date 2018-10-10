// http://snippets.dzone.com/posts/show/2039

export function str_hex(str) {
  console.log("todo str_hex", str);
  const hex = "";

  /*
  for (let i = 0; i < str.length; i++) {
    hex += dechex(str.charCodeAt(i));
  }
  */

  return hex;
}

// const WORD_COUNT_MASK = "/\\p{L}[\\p{L}\\p{Mn}\\p{Pd}'\\x{2019}]*/u";

export function str_word_count_utf8(str, format = 0) {
  console.log("todo str_word_count_utf8", str, format);
  return 999;
  /*
  switch (format) {
    case 1:
      preg_match_all(WORD_COUNT_MASK, str, matches);
      return matches[0];

    case 2:
      preg_match_all(WORD_COUNT_MASK, str, matches, PREG_OFFSET_CAPTURE);
      const result = Array();

      for (const match of Object.values(matches[0])) {
        result[match[1]] = match[0];
      }

      return result;
  }

  return preg_match_all(WORD_COUNT_MASK, str, matches);
  */
}
