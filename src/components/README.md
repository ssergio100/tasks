# Tasks3

Exibe lista de tarefas (`tasks`) baseada em dados persistidos no banco IndexedDB (via Dexie.js). O componente oferece funcionalidades para gerenciar tarefas, incluindo iniciar/pausar, arquivar, excluir, importar e exportar tasks e copiar informações para a área de transferência e alternar entre nodo claro e escuro. Integra um modal para adicionar ou editar tarefas e um snackbar para exibir mensagens ao usuário.

## Dependências

- **Vue 3** (com a API `setup`)
- **Vuetify 3** para a interface de usuário
- **IndexedDB** (via **Dexie.js**) para a persistência de dados
- **ModalAddTasks**: Componente filho responsável por adicionar/editar tarefas

## Estrutura do Template

### Layout Principal

O componente é encapsulado dentro de um `<v-container>`. Ele exibe tarefas em cartões (`<v-card>`), com base no estado da variável `tasks`.

- Se não houver tarefas, um alerta (`<v-alert>`) é mostrado com a mensagem "Nenhum registro".
- Cada tarefa é renderizada dentro de um `<v-col>` e `<v-card>` com informações como número, resumo, status, e links relacionados.
- Ícones de ação permitem que o usuário interaja com cada tarefa:
  - Iniciar/pausar tarefa (`mdi-play` / `mdi-pause`)
  - Arquivar tarefa (`mdi-archive`)
  - Excluir tarefa (`mdi-delete`)
  - Limpar o tempo da tarefa (`mdi-refresh`, se já houver tempo registrado)

### Exibição da Tarefa

- **Título e Resumo**: O número da tarefa (`task.number`) e o resumo (`task.summary`) são exibidos no título do cartão. 
  - Clicar no número ou no resumo copia o respectivo texto para a área de transferência.
  
- **Status da Tarefa**: O tempo decorrido é exibido e atualizado a cada segundo para tarefas em execução (`status_id === 2`). Para outras tarefas, o tempo total é mostrado.

- **Links**: Se disponíveis, links para ambientes de desenvolvimento, homologação e produção são mostrados como círculos coloridos (`mdi-circle`) e clicáveis.

### Modal para Adicionar/Editar Tarefas

O componente modal `ModalAddTasks` é chamado para adicionar ou editar uma tarefa. Ele é referenciado no template via `ref="modalAddTask"`.

- Quando uma tarefa é clicada duas vezes, o modal é aberto para edição da tarefa selecionada.
  
### Snackbar

Um `snackbar` é exibido para mostrar mensagens de feedback ao usuário, como o sucesso de uma ação (por exemplo, ao copiar um texto ou arquivar uma tarefa).

## Estrutura do Script

### Propriedades

- `statusView`: Propriedade recebida do componente pai, usada para filtrar as tarefas (exibir arquivadas ou não arquivadas).

### Estado

- `tasks`: Um array de tarefas carregado do banco de dados IndexedDB.
- `time`: Um contador usado para exibir o tempo de uma tarefa em execução.
- `snackbar`: Configurações do snackbar (mensagem, tempo de exibição, visibilidade).
- `intervalHandle`: Controla o intervalo do timer para tarefas em execução.

### Funções

- **`loadTasks()`**: Carrega as tarefas do banco de dados com base no `statusView` (2 = não arquivadas, 3 = arquivadas).
  
- **`startTimer(task)`**: Inicia o temporizador para uma tarefa em execução e atualiza o tempo a cada 5 segundos no banco de dados.

- **`stopTimer()`**: Para o temporizador se estiver em execução.

- **`toggeStatus(task)`**: Alterna o status da tarefa entre iniciado (`status_id = 2`) e pausado (`status_id = 1`), e pausa todas as outras tarefas ativas.

- **`pauseAll()`**: Pausa todas as tarefas que estão com o status de execução.

- **`archiveTask(task)`**: Alterna o estado de arquivamento da tarefa entre arquivada e não arquivada.

- **`deleteTask(task)`**: Remove a tarefa do banco de dados.

- **`clearTimeTask(task)`**: Zera o tempo registrado para uma tarefa.

- **`copyText(text)`**: Copia um texto para a área de transferência.

- **`openLink(url)`**: Abre um link em uma nova aba do navegador.

- **`formatTime(seconds)`**: Formata o tempo da tarefa (segundos) em um formato `DD:HH:MM:SS`.

- **`findAndHandleRunningTask()`**: Ao carregar o componente, encontra qualquer tarefa em execução e a retoma.

- **`showSnackbar(message, color, timeout)`**: Exibe uma mensagem no snackbar por um tempo determinado.

### Watchers

- **`watch(() => props.statusView, loadTasks)`**: Atualiza a lista de tarefas sempre que o `statusView` for alterado.

### Lifecycle Hooks

- **`onMounted()`**: Carrega as tarefas e verifica se há alguma tarefa em execução quando o componente é montado.

## Estilos

Estilos específicos podem ser aplicados via classes do Vuetify e propriedades inline nos componentes.


