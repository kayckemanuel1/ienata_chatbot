
// Carregando o arquivo JSON
const fs = require('fs');
const dados = JSON.parse(fs.readFileSync('cadastro.json', 'utf-8'));

function verificarSeUsuario(telefone) {
    for (let usuario of dados.usuarios) {
        if (usuario.telefone === telefone) {
            return true;
        }
    }
    return false;
}

function obterConfianca(telefone) {
    for (let usuario of dados.usuarios) {
        if (usuario.telefone === telefone) {
            return usuario.confianca;
        }
    }
    return null;
}

function obterNome(telefone) {
    for (let usuario of dados.usuarios) { 
        if (usuario.telefone === telefone) {
            return usuario.nome;
        }
    }
    return null;
}

// Cria uma nova instância do cliente
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const client = new Client({
    authStrategy: new LocalAuth()
});

// Gera o QR Code para autenticação
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code gerado, escaneie com o WhatsApp');
});

// Indica quando o cliente está pronto
client.on('ready', () => {
    console.log('O cliente está pronto!');
});

// ---------------- Loop principal que escuta as mensagens recebidas -----------------
client.on('message', message => {

    // Captura do remetente da mensagem
    console.log(`Mensagem recebida de ${message.from}: ${message.body}`);
    var numeroDoRemetente = message.from.replace('@c.us', '');
    var confianca = obterConfianca(numeroDoRemetente);
    var usuario_cadastrado = verificarSeUsuario(numeroDoRemetente);

    if (!usuario_cadastrado) {
        message.reply('Usuário não cadastrado. Se você é o administrador do sistema, veja o tutorial de como cadastrar usuários em: https://github.com/kayckemanuel1/ienata_chatbot');
    }

    if (usuario_cadastrado) {

        // Variaveis iniciais
        var numeroDoRemetente = message.from.replace('@c.us', '');
        var confianca = obterConfianca(numeroDoRemetente);
        var usuario_cadastrado = verificarSeUsuario(numeroDoRemetente);
        var agora = new Date();
        var data = agora.toISOString().split('T')[0];
        var hora = agora.toTimeString().split(' ')[0];
        var nome_emissor = obterNome(numeroDoRemetente);

        // #  Ping (Teste de atividade) # 
        if (message.body === '!ping') {
            message.reply('pong!');
        }

        // #  Disparo do alerta # 
        if (message.body.startsWith('!pedido')) { 
            var descricao = message.body.slice(8).trim(); 
            var mensagem = '🚨 Você recebeu um alerta de ' + nome_emissor + '!🚨' + ' \n⏱️ Data e hora: ' + data + ', ' + hora + '\n💬 Descrição: "' + descricao + '"';

            for (let i = 0; i < confianca.length; i++) {
                var telefone = confianca[i];
                var chatId = telefone + '@c.us';

                client.sendMessage(chatId, mensagem).then(response => {
                    console.log('Mensagem enviada com sucesso para ' + telefone);
                }).catch(err => {
                    console.error('Erro ao enviar mensagem: ', err);
                });
            }
        }

        // #  encaminhamento de localização # 
        if (message.type === 'location') {
    
            var latitude = message.location.latitude;
            var longitude = message.location.longitude;
            var name = message.location.name || 'Localização sem nome'; // Nome da localização, se disponível
            var url_google = `https://www.google.com/maps?q=${latitude},${longitude}`;
            var url_osm = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`;
        
            
            message.reply('Localização enviada com sucesso!');
            mensagem = `📍Localizaão recebida de: ${nome_emissor}!\n⏱️ Data e hora: ${data}, ${hora}\n🏙️ Nome do local: ${name}\nLatitude: ${latitude},\nLongitude: ${longitude}\n1️⃣ URL 1: ${url_google}\n2️⃣ URL 2: ${url_osm}`;
        
            // Envia a localização para os contatos de confiança
            for (let i = 0; i < confianca.length; i++) {
                var telefone = confianca[i];
                var chatId = telefone + '@c.us';
                client.sendMessage(chatId, mensagem).then(response => {
                    console.log('Mensagem enviada com sucesso para ' + telefone);
                }).catch(err => {
                    console.error('Erro ao enviar mensagem: ', err);
                });
            }
        }
        

        
    }
});

// Inicia o cliente
client.initialize();