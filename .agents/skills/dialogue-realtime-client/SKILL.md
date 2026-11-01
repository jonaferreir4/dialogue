---
name: dialogue-realtime-client
description: Padrões de arquitetura e boas práticas para gerenciamento de conexões WebSockets / SignalR com @microsoft/signalr no React 19.
---

# Dialogue Realtime Client Skill

Este guia define padrões mandatórios para consumo do backend SignalR no frontend React (`Dialogue-front`).

## 1. Gerenciamento do Ciclo de Vida da Conexão

- **Single Hub Instance**: Nunca crie múltiplas conexões para o mesmo Hub simultaneamente. O `HubConnection` deve ser gerenciado por um Context Provider global ou Hook isolado.
- **Variáveis de Ambiente**: Nunca utilize URLs hardcoded (`http://localhost:5000`). Sempre utilize `import.meta.env.VITE_API_URL`.
- **Limpeza de Eventos**: Sempre remova os listeners de eventos (`connection.off(...)`) no cleanup de `useEffect` para evitar vazamentos de memória e disparos duplicados.
- **Auto Reconnect**: Sempre configure `.withAutomaticReconnect()`. Trate os callbacks `onreconnecting` e `onreconnected` para manter o usuário informado e refazer `joinRoom` caso necessário.

## 2. Indicadores de Digitação (Typing Indicator)

- No envio: acione `StartTyping` com debounce. Limpe o timer e dispare `StopTyping` após 1.5s a 2s de inatividade ou ao submeter a mensagem.
- Na recepção: guarde o nome de quem está digitando (`typingUser`), evitando exibir o próprio usuário logado como autor da ação.

## 3. Estrutura e Renderização de Mensagens

- Receba a tupla `(sender, message, timestampUtc, messageId)`.
- Utilize `messageId` como `key` única no React para garantir estabilidade na renderização e prevenir re-renderizações desnecessárias.
- Formate `timestampUtc` utilizando o fuso horário local do cliente via `new Intl.DateTimeFormat(...)` ou helpers nativos.
- Utilize scroll automático suave (`messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })`) quando novas mensagens chegarem, contanto que o usuário não tenha rolado para cima para ler o histórico.

## 4. Chamadas de Áudio e Vídeo 1:1 (WebRTC P2P)

- **Ciclo de Vida do `<video>` e `srcObject`**: Nunca atrele `srcObject = stream` via `useEffect` no componente pai se a tag `<video>` estiver dentro de renderização condicional ou transições assíncronas do Material UI (como `<Dialog>`). Utilize um subcomponente isolado (`<VideoPlayer>`) que garante a existência do elemento DOM antes de executar `.play()`.
- **Streams Multi-Track e Re-renders**: No evento `pc.ontrack`, as tracks de áudio e vídeo chegam em eventos separados com a mesma referência de stream. Sempre instancie um novo `MediaStream` (`setRemoteStream(new MediaStream(stream.getTracks()))`) e escute `track.onunmute` para forçar o React a atualizar a interface.
- **Resolução de URL Dinâmica (Mobile & Tunnels)**: Nunca deixe `VITE_API_URL=http://localhost:5000` fixo no `.env` em produção. Em conexões HTTPS (Cloudflare Tunnels) ou acesso por IP na rede local (celular), priorize `window.location.origin` para que o tráfego passe corretamente pelo proxy reverso do Nginx.

