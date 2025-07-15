# Folha Digital - Prumo Engenharia

App web responsivo para registro de ponto, integrado ao Google Sheets via Apps Script.  
Ideal para uso em celular, com visual semelhante ao Excel.

## Como usar

1. Faça login com seu nome e matrícula.
2. Preencha sua folha digital.
3. Clique em "Salvar" para registrar seus dados.

## Como instalar

- Hospede os arquivos no GitHub Pages.
- Configure o backend no Google Apps Script conforme explicado abaixo.

## Backend (Google Apps Script)

1. Crie uma nova planilha no Google Drive.
2. Crie duas abas:
   - `usuarios` (colunas: nome, matricula)
   - `registros` (colunas: nome, matricula, data, dia, col0, col1, ..., col8)
3. No menu: `Extensões > Apps Script`, cole o código do backend (veja abaixo).
4. Publique como Web App: `Implantar > Nova implantação > Tipo: Web app > Executar como: Eu > Qualquer pessoa`.
5. Copie a URL gerada e coloque em SHEET_URL no script.js.

## Observações

- Cada usuário só vê seus próprios registros.
- Todos os dados ficam salvos na planilha do Google.

## Exemplo de código Apps Script

```javascript
function doGet(e) {
  const action = e.parameter.action;
  if (action === "login") {
    return login(e);
  }
  if (action === "carregar") {
    return carregar(e);
  }
  return ContentService.createTextOutput(JSON.stringify({ erro: "Ação inválida" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.action === "salvar") {
    return salvar(data);
  }
  return ContentService.createTextOutput(JSON.stringify({ erro: "Ação inválida" })).setMimeType(ContentService.MimeType.JSON);
}

function login(e) {
  const nome = (e.parameter.nome || "").toLowerCase();
  const matricula = (e.parameter.matricula || "");
  const sh = SpreadsheetApp.getActive().getSheetByName("usuarios");
  const dados = sh.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0].toLowerCase() === nome && dados[i][1] == matricula) {
      return ContentService.createTextOutput(JSON.stringify({ sucesso: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ sucesso: false })).setMimeType(ContentService.MimeType.JSON);
}

function carregar(e) {
  const nome = (e.parameter.nome || "");
  const matricula = (e.parameter.matricula || "");
  const sh = SpreadsheetApp.getActive().getSheetByName("registros");
  const dados = sh.getDataRange().getValues();
  const registros = [];
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] === nome && dados[i][1] == matricula) {
      const reg = {};
      reg.data = dados[i][2];
      reg.dia = dados[i][3];
      for (let j = 0; j < 9; j++) reg[`col${j}`] = dados[i][4 + j];
      registros.push(reg);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ registros })).setMimeType(ContentService.MimeType.JSON);
}

function salvar(data) {
  const nome = data.nome;
  const matricula = data.matricula;
  const registros = data.registros;
  const sh = SpreadsheetApp.getActive().getSheetByName("registros");
  // Remove registros antigos do usuário
  const dados = sh.getDataRange().getValues();
  for (let i = dados.length - 1; i > 0; i--) {
    if (dados[i][0] === nome && dados[i][1] == matricula) {
      sh.deleteRow(i + 1);
    }
  }
  // Adiciona novos registros
  registros.forEach(r => {
    const linha = [nome, matricula, r.data, r.dia];
    for (let j = 0; j < 9; j++) linha.push(r[`col${j}`] || "");
    sh.appendRow(linha);
  });
  return ContentService.createTextOutput(JSON.stringify({ sucesso: true })).setMimeType(ContentService.MimeType.JSON);
}
``` 