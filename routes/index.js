var Tetrapod = require('../components/Tetrapod.js');

var express = require('express');
var router = express.Router();


// Tetrapod 비속어 필터 불러오기
Tetrapod.defaultLoad();
console.log('FINISH DEFAULTLOAD!!!');
let badWords = Tetrapod.getLoadedData().badWords;
let normalWords = Tetrapod.getLoadedData().normalWords;
let vulgarWords = Tetrapod.getLoadedData().softSearchWords;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* 비속어 필터 JSON 결과 */
router.get('/badwords', function(req, res) {
  res.json(badWords);
});

/* 저속한 단어 필터 JSON 결과 */
router.get('/vulgarwords', function(req, res) {
  res.json(vulgarWords);
});

/* 정상 단어 필터 JSON 결과 */
router.get('/normalwords', function(req, res) {
  res.json(normalWords);
});

// 문장 내 비속어 단어 찾기 오브젝트 /find?sentence=문장&
router.get('/find', function(req, res, next) {
  let inputSentence = req.query['sentence']; // 입력 문장
  let multiple = req.query['multiple']; // 중복 검사 여부
  let korEng = req.query['korEng']; // 한영자판혼합 검사
  let stronger = req.query['stronger']; // 더 강하게 검사
  res.json(Tetrapod.find(inputSentence, Boolean(multiple), 15, Boolean(korEng), Boolean(stronger)));
});

// 문장 내 비속어 결자처리 /replace?sentence=문장&...
router.get('/replace', function(req, res, next) {
  let inputSentence = req.query['sentence']; // 입력 문장
  let replaceChar = req.query['replace']; // 결자 처리할 단어.
  if (!replaceChar) {replaceChar = '*'; }
  let korEng = req.query['korEng']; // 한영자판 혼합
  let dropDouble = req.query['dropDouble']; // 쌍자음
  let antispoof = req.query['antispoof']; // ㄱH처럼 자음/모음을 다른 문자로 혼횽한 부분 있는지 체크
  let fixVulgar = req.query['fixVulgar']; // 저속한 단어도 복자처리할 지 확인
  let isOriginal = req.query['isOriginal']; //
  let obj = {
    qwertyToDubeol: Boolean(korEng),
    dropDouble: Boolean(dropDouble),
    antispoof: Boolean(antispoof),
    fixSoft: Boolean(fixVulgar),
    isOriginal: Boolean(isOriginal)
  }
  res.send(Tetrapod.fix(inputSentence, replaceChar, obj));
});


module.exports = router;
