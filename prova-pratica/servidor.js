const express = require('express');
const treinosController = require('./controllers/treinosController.js');
const authController = require('./controllers/authController.js');

const app = express();
app.use(express.json());
app.use(express.static('public'));   // a tela (build do web/) sai daqui

// treinos
app.get('/treinos', treinosController.listar);
app.get('/treinos/total', treinosController.total);       // ANTES do /:id
app.get('/treinos/:id', treinosController.buscarUm);
app.post('/treinos', treinosController.criar);
app.put('/treinos/:id', treinosController.atualizar);
app.delete('/treinos/:id', treinosController.remover);
app.put('/treinos/:id/concluir', treinosController.concluir);

// autenticacao
app.post('/login', authController.login);
app.post('/cadastro', authController.cadastro);
app.get('/perfil', authController.perfil);
app.post('/logout', authController.logout);

const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
