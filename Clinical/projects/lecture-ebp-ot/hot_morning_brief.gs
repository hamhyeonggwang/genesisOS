/**
 * H.OT MORNING BRIEF
 * 작업치료 주간 브리핑 메일 — 매주 월요일 오전 9시 발송
 *
 * 사전 준비 (프로젝트 설정 > 스크립트 속성):
 *  - CLAUDE_API_KEY        : Claude API 키
 *  - SUBSCRIBER_SHEET_ID   : 구독자 명단 스프레드시트 ID
 *  - SUBSCRIBER_SHEET_NAME : (선택) 시트 이름, 기본값 '구독자'
 *
 * 구독자 시트 형식: A열에 이메일 주소(1행은 헤더), 2행부터 수신자.
 * 최초 1회 createWeeklyTrigger() 를 실행하면 월요일 09:00 트리거가 설치됩니다.
 */

function sendHOTMorningBrief() {

  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty('CLAUDE_API_KEY');

  if (!apiKey) {
    throw new Error('프로젝트 설정 > 스크립트 속성에 CLAUDE_API_KEY를 추가하세요.');
  }

  const recipients = getRecipients();

  if (recipients.length === 0) {
    Logger.log('구독자가 없어 발송을 건너뜁니다.');
    return;
  }

  // 작업치료 관련 주요 뉴스 · 정책 (IT·AI 카테고리 제거)
  const categories = [
    {
      name: '주요 뉴스',
      query: '작업치료 OR 재활 OR 장애인'
    },
    {
      name: '정책',
      query: '보건복지부 OR 건강보험 OR 발달재활서비스'
    }
  ];

  const newsletter = {
    date: Utilities.formatDate(
      new Date(),
      'Asia/Seoul',
      'yyyy.MM.dd (E)'
    ),
    categories: [],
    headlines: []
  };

  categories.forEach(category => {

    try {

      const feedUrl =
        `https://news.google.com/rss/search?q=${encodeURIComponent(category.query)}&hl=ko&gl=KR&ceid=KR:ko`;

      const xml = UrlFetchApp.fetch(feedUrl).getContentText();

      const document = XmlService.parse(xml);

      const items = document
        .getRootElement()
        .getChild('channel')
        .getChildren('item');

      const articles = [];

      for (let i = 0; i < Math.min(2, items.length); i++) {

        const item = items[i];

        const rawTitle = item.getChildText('title') || '';
        const description = item.getChildText('description') || '';
        const link = item.getChildText('link') || '';

        newsletter.headlines.push(rawTitle);

        const prompt = `
다음 뉴스를 2문장으로 요약하세요.

조건:
- 과장 금지
- 추측 금지
- 80자 이내

제목: ${rawTitle}

내용:
${description}
`;

        const summary = callClaude(prompt, apiKey);

        articles.push({
          title: cleanTitle(rawTitle),
          source: extractSource(rawTitle),
          summary: summary,
          url: link
        });
      }

      newsletter.categories.push({
        name: category.name,
        articles: articles
      });

    } catch (error) {

      Logger.log(`${category.name}: ${error.message}`);

    }

  });

  const editorNote = generateEditorNote(
    newsletter.headlines,
    apiKey
  );

  const html = buildNewsletterHtml(
    newsletter,
    editorNote
  );

  const subject = `H.OT MORNING BRIEF | ${newsletter.date}`;

  let sent = 0;

  recipients.forEach(email => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: html,
        name: 'H.OT MORNING BRIEF'
      });
      sent++;
    } catch (error) {
      Logger.log(`발송 실패 (${email}): ${error.message}`);
    }
  });

  Logger.log(`${sent}/${recipients.length}명에게 발송 완료`);

}


/**
 * 구독자 명단 스프레드시트의 A열(이메일)을 읽어 유효한 주소만 반환.
 */
function getRecipients() {

  const props = PropertiesService.getScriptProperties();

  const sheetId = props.getProperty('SUBSCRIBER_SHEET_ID');

  if (!sheetId) {
    throw new Error('스크립트 속성에 SUBSCRIBER_SHEET_ID(구독자 시트 ID)를 추가하세요.');
  }

  const sheetName = props.getProperty('SUBSCRIBER_SHEET_NAME') || '구독자';

  const sheet = SpreadsheetApp
    .openById(sheetId)
    .getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`시트 '${sheetName}'를 찾을 수 없습니다.`);
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  // A2:A<끝>  — 1행은 헤더
  const values = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues();

  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const emails = values
    .map(row => String(row[0]).trim())
    .filter(email => emailPattern.test(email));

  // 중복 제거
  return [...new Set(emails)];

}


/**
 * 매주 월요일 오전 9시(Asia/Seoul) 자동 발송 트리거 설치. (최초 1회 실행)
 */
function createWeeklyTrigger() {

  // 기존 동일 트리거 제거 (중복 방지)
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendHOTMorningBrief')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('sendHOTMorningBrief')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .inTimezone('Asia/Seoul')
    .create();

  Logger.log('월요일 09:00 발송 트리거를 설치했습니다.');

}


function callClaude(prompt, apiKey) {

  const response = UrlFetchApp.fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 300,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      muteHttpExceptions: true
    }
  );

  const result = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.content[0].text.trim();
}


function generateEditorNote(headlines, apiKey) {

  const prompt = `
당신은 H.OT MORNING BRIEF의 편집장입니다.

오늘 뉴스의 핵심 흐름을 3문장으로 정리하세요.

조건:
- 과장 금지
- 추측 금지
- 작업치료사 관점 유지

뉴스 목록:

${headlines.join('\n')}
`;

  return callClaude(prompt, apiKey);
}


function cleanTitle(title) {

  return title.split(' - ')[0].trim();

}


function extractSource(title) {

  const parts = title.split(' - ');

  return parts.length > 1
    ? parts[parts.length - 1]
    : 'Google News';

}


function buildNewsletterHtml(data, editorNote) {

  let sections = '';

  data.categories.forEach(category => {

    sections += `
      <h2 style="
        margin-top:32px;
        color:#0F172A;
        font-size:24px;
      ">
        ${category.name}
      </h2>
    `;

    category.articles.forEach(article => {

      sections += `
        <div style="
          border-bottom:1px solid #E2E8F0;
          padding:20px 0;
        ">

          <div style="
            font-size:20px;
            font-weight:700;
            color:#0F172A;
            line-height:1.4;
          ">
            ${article.title}
          </div>

          <div style="
            margin-top:12px;
            color:#475569;
            line-height:1.8;
            font-size:16px;
          ">
            ${article.summary}
          </div>

          <div style="
            margin-top:12px;
            color:#64748B;
            font-size:14px;
          ">
            ${article.source}
          </div>

          <div style="margin-top:12px;">
            <a href="${article.url}" style="
              color:#2563EB;
              text-decoration:none;
            ">
              원문 보기 →
            </a>
          </div>

        </div>
      `;
    });
  });

  return `
<!DOCTYPE html>
<html>
<body style="
  margin:0;
  padding:24px;
  background:#F8FAFC;
  font-family:'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕',sans-serif;
">

<div style="
  max-width:640px;
  margin:0 auto;
  background:#FFFFFF;
  border-radius:20px;
  padding:40px;
">

  <div style="
    color:#64748B;
    font-size:14px;
  ">
    ${data.date}
  </div>

  <h1 style="
    color:#0F172A;
    font-size:42px;
    margin:12px 0;
  ">
    H.OT MORNING BRIEF
  </h1>

  <div style="
    color:#475569;
    line-height:1.8;
    font-size:18px;
  ">
    오늘의 작업치료 이슈, 실무에 연결하는 아침 브리핑
  </div>

  <div style="
    margin-top:32px;
    background:#F1F5F9;
    border-radius:16px;
    padding:24px;
  ">

    <div style="
      color:#2563EB;
      font-size:14px;
      font-weight:700;
      margin-bottom:12px;
    ">
      EDITOR'S NOTE
    </div>

    <div style="
      color:#334155;
      line-height:1.8;
      font-size:16px;
    ">
      ${editorNote.replace(/\n/g, '<br>')}
    </div>

  </div>

  ${sections}

  <div style="
    margin-top:40px;
    padding-top:24px;
    border-top:1px solid #E2E8F0;
    color:#94A3B8;
    font-size:13px;
  ">
    © 2026 H.OT MORNING BRIEF
  </div>

</div>

</body>
</html>
`;
}
