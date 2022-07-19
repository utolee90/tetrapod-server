var Tetrapod = require('../components/Tetrapod.js');

var express = require('express');
var router = express.Router();


// Tetrapod 비속어 필터 불러오기
let tetrapod = new Tetrapod();
tetrapod.loadFile();
console.log('FINISH DEFAULTLOAD!!!');

let badWords = tetrapod.getLoadedData().badWords;
let normalWords = tetrapod.getLoadedData().normalWords;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* 비속어 필터 JSON 결과 */
router.get('/badwords', function(req, res) {
  res.json(badWords);
});

/* 정상 단어 필터 JSON 결과 */
router.get('/normalwords', function(req, res) {
  res.json(normalWords);
});

// 문장 내 비속어 단어 찾기 오브젝트 /find?sentence=문장&
router.get('/find', function(req, res, next) {
  let inputSentence = req.query['sentence']; // 입력 문장
  let multiple = req.query['multiple']; // 중복 검사 여부
  let qwerty = req.query['qwerty']; // 한영자판혼합 검사
  let antispoof = req.query['antispoof']; // antispoof
  let pronounce = req.query['pronounce']; // 영어 발음 검사
  let dropDouble = req.query['dropdouble']; // 한글 중복음 삭제
  let cond = [];
  if (Boolean(qwerty)) cond.push(['qwerty']);
  if (Boolean(antispoof)) cond.push(['antispoof']);
  if (Boolean(pronounce)) cond.push(['pronounce']);
  tetrapod.adjustFilter([], [], cond, Boolean(dropDouble));
  res.json(tetrapod.find(inputSentence, Boolean(multiple), 20));
});

// 문장 내 비속어 결자처리 /replace?sentence=문장&...
router.get('/replace', function(req, res, next) {
  let inputSentence = req.query['sentence']; // 입력 문장
  let replaceChar = req.query['replace']; // 결자 처리할 단어.
  if (!replaceChar) {replaceChar = '*'; }
  let qwerty = req.query['qwerty']; // 한영자판 혼합
  let dropDouble = req.query['dropdouble']; // 쌍자음
  let antispoof = req.query['antispoof']; // ㄱH처럼 자음/모음을 다른 문자로 혼횽한 부분 있는지 체크
  let pronounce = req.query['pronounce']; // 영자발음을 한글로 바꾸어서 치환한 뒤 검사.
  let cond = [];
  if (Boolean(qwerty)) cond.push(['qwerty']);
  if (Boolean(antispoof)) cond.push(['antispoof']);
  if (Boolean(pronounce)) cond.push(['pronounce']);
  tetrapod.adjustFilter([], [], cond, Boolean(dropDouble));
  res.send(tetrapod.fix(inputSentence, replaceChar));
});

// 문장 내 비속어 갯수 세기
router.get('/count', function(req, res, next) {
  let inputSentence = req.query['sentence']; // 입력 문장
  let qwerty = req.query['qwerty']; // 한영자판혼합 검사
  let antispoof = req.query['antispoof']; // antispoof
  let pronounce = req.query['pronounce']; // 영어 발음 검사
  let dropDouble = req.query['dropdouble']; // 한글 중복음 삭제
  let cond = [];
  if (Boolean(qwerty)) cond.push(['qwerty']);
  if (Boolean(antispoof)) cond.push(['antispoof']);
  if (Boolean(pronounce)) cond.push(['pronounce']);
  tetrapod.adjustFilter([], [], cond, Boolean(dropDouble));
  res.json(tetrapod.countBad(inputSentence));
});


module.exports = router;
