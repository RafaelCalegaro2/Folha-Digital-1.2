// Configurações
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxFrRFUH2doyJdLoryn1PUFy3qmp9SfSyTMDSyd4GB3IC0-DB2zO7ngx5X35lVWK342/exec"; // Troque depois de publicar o Apps Script

// Datas do período (exemplo: 21/06/2025 a 20/07/2025)
const DIAS = [
  { data: "21/06/2025", dia: "sábado" }, { data: "22/06/2025", dia: "domingo" },
  { data: "23/06/2025", dia: "segunda-feira" }, { data: "24/06/2025", dia: "terça-feira" },
  { data: "25/06/2025", dia: "quarta-feira" }, { data: "26/06/2025", dia: "quinta-feira" },
  { data: "27/06/2025", dia: "sexta-feira" }, { data: "28/06/2025", dia: "sábado" },
  { data: "29/06/2025", dia: "domingo" }, { data: "30/06/2025", dia: "segunda-feira" },
  { data: "01/07/2025", dia: "terça-feira" }, { data: "02/07/2025", dia: "quarta-feira" },
  { data: "03/07/2025", dia: "quinta-feira" }, { data: "04/07/2025", dia: "sexta-feira" },
  { data: "05/07/2025", dia: "sábado" }, { data: "06/07/2025", dia: "domingo" },
  { data: "07/07/2025", dia: "segunda-feira" }, { data: "08/07/2025", dia: "terça-feira" },
  { data: "09/07/2025", dia: "quarta-feira" }, { data: "10/07/2025", dia: "quinta-feira" },
  { data: "11/07/2025", dia: "sexta-feira" }, { data: "12/07/2025", dia: "sábado" },
  { data: "13/07/2025", dia: "domingo" }, { data: "14/07/2025", dia: "segunda-feira" },
  { data: "15/07/2025", dia: "terça-feira" }, { data: "16/07/2025", dia: "quarta-feira" },
  { data: "17/07/2025", dia: "quinta-feira" }, { data: "18/07/2025", dia: "sexta-feira" },
  { data: "19/07/2025", dia: "sábado" }, { data: "20/07/2025", dia: "domingo" }
];

// Funções auxiliares
function $(id) { return document.getElementById(id); }

function exibirLogin() {
  $("login-container").style.display = "block";
  $("folha-container").style.display = "none";
}

function exibirFolha(usuario) {
  $("login-container").style.display = "none";
  $("folha-container").style.display = "block";
  $("user-info").innerText = `Usuário: ${usuario.nome}`;
  gerarTabelaFolha();
  carregarRegistros(usuario);
}

function gerarTabelaFolha() {
  const tabela = $("folha-tabela");
  tabela.innerHTML = "";
  // Cabeçalho
  const head = tabela.insertRow();
  ["Data", "Dia", "Entrada", "Saída (intervalo)", "Entrada (intervalo)", "Saída", "H. Trabalhadas", "Extra", "Viagem Longa", "Placa"].forEach(txt => {
    const th = document.createElement("th");
    th.innerText = txt;
    head.appendChild(th);
  });
  // Linhas
  DIAS.forEach((d, i) => {
    const row = tabela.insertRow();
    row.className = (d.dia === "sábado" || d.dia === "domingo") ? "fim-semana" : "";
    row.insertCell().innerText = d.data;
    row.insertCell().innerText = d.dia;
    for (let j = 0; j < 9; j++) {
      const cell = row.insertCell();
      const input = document.createElement("input");
      input.type = "text";
      input.name = `cell_${i}_${j}`;
      input.style.width = "95%";
      cell.appendChild(input);
    }
  });
}

function getDadosTabela() {
  const dados = [];
  DIAS.forEach((d, i) => {
    const linha = { data: d.data, dia: d.dia };
    for (let j = 0; j < 9; j++) {
      linha[`col${j}`] = document.querySelector(`[name=cell_${i}_${j}]`).value;
    }
    dados.push(linha);
  });
  return dados;
}

// Login
$("login-form").onsubmit = async function(e) {
  e.preventDefault();
  const nome = $("nome").value.trim();
  const matricula = $("matricula").value.trim();
  $("login-erro").innerText = "Verificando...";
  // Chama Apps Script para validar
  const resp = await fetch(SHEET_URL + `?action=login&nome=${encodeURIComponent(nome)}&matricula=${encodeURIComponent(matricula)}`);
  const data = await resp.json();
  if (data.sucesso) {
    localStorage.setItem("usuario", JSON.stringify({ nome, matricula }));
    exibirFolha({ nome, matricula });
  } else {
    $("login-erro").innerText = "Nome ou matrícula inválidos!";
  }
};

// Logout
$("logout-btn").onclick = function() {
  localStorage.removeItem("usuario");
  exibirLogin();
};

// Salvar folha
$("folha-form").onsubmit = async function(e) {
  e.preventDefault();
  $("folha-msg").innerText = "Salvando...";
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const registros = getDadosTabela();
  const resp = await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "salvar",
      nome: usuario.nome,
      matricula: usuario.matricula,
      registros
    }),
    headers: { "Content-Type": "application/json" }
  });
  const data = await resp.json();
  $("folha-msg").innerText = data.sucesso ? "Salvo com sucesso!" : "Erro ao salvar!";
};

// Carregar registros existentes
async function carregarRegistros(usuario) {
  $("folha-msg").innerText = "Carregando...";
  const resp = await fetch(SHEET_URL + `?action=carregar&nome=${encodeURIComponent(usuario.nome)}&matricula=${encodeURIComponent(usuario.matricula)}`);
  const data = await resp.json();
  if (data.registros) {
    DIAS.forEach((d, i) => {
      for (let j = 0; j < 9; j++) {
        document.querySelector(`[name=cell_${i}_${j}]`).value = data.registros[i]?.[`col${j}`] || "";
      }
    });
  }
  $("folha-msg").innerText = "";
}

// Autologin se já estiver logado
window.onload = function() {
  const usuario = localStorage.getItem("usuario");
  if (usuario) {
    exibirFolha(JSON.parse(usuario));
  }
}; 