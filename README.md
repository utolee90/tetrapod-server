# Tetrapod Server

## 개요
node.js 기반의 비속어 필터링 소스 [Tetrapod](https://github.com/utolee90/Tetrapod)를 Express.js 기반의 웹 서버에서 사용 가능하게 한 소스입니다.

## 사용방법
다운로드 받은 뒤 콘솔창에서 다음과 같은 소스를 입력하면 로컬 서버 3000포트에서 구동됩니다.
```
npm start
```

### 비속어 목록 바꾸기
`/components/dictionaries`의 json 파일을 변경하면 비속어 필터링되는 단어를 바꿀 수 있습니다.

### 현재 구현된 기능
* `/badwords` - 비속어 목록 (단순 리스트로 표시됩니다.)
* `/normalwords` - 정상 단어 목록 (단순 리스트로 표시됩니다.)
* `/vulgarwords` - 저속한 단어 목록 (단순 리스트로 표시됩니다.)
* `/find` - 문장 입력시 비속어 찾기
* `/replace` - 문장 입력시 비속어를 결자처리하기
