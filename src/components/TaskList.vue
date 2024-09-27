<template>

    <v-row>
      <v-alert   type="info" v-if="tasks.length === 0" icon="mdi-clipboard-text-outline" :text=" archiveds == false? 'Nenhuma task cadastrada' : 'Nenhuma task arquivada'"></v-alert>

      <v-col v-for="task in tasks" :key="task.id" cols="12" :md="colNum"  style="padding:3px !important;">
        <v-card 
        @pointerdown="playVideo()"
        v-touch="{
          left: () => swipe('Left', task),
          right: () => swipe('Right', task),
        }"
        class="mx-auto" 
        hover :color="task.archived === 1 ? '#FFEB3B' : 'defaultColor'" 
        @dblclick="handleDoubleClick(task)"
        >
          <v-row align="center" no-gutters 
          style="padding-right: 20px;
          ">
            <v-col>
              <v-card-title style="font-size: 14px;" >
                <span :style="{ color: task.color }"  @click="copyText(task.number)" >{{ task.number }}</span>
                <span style="font-size: 12px;" class="text-truncate"  @click="copyText(task.summary)"> - {{ truncate(task.summary, colNum === 6 ? 60 : 200) }}</span>
              </v-card-title>

              <v-card-subtitle  class="card-subtitle"  v-if="!isMobile">
				        <span class="time"  
                  @click="clearTimeTask(task)">
                  {{ task.status_id === 2 ? formattedTime : formatTime(task.time) }}
                </span>
              
                <span v-if="!isMobile" > 
                  <v-tooltip :text=task.comments>
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" @click="copyText(task.comments)"
                        v-if="task.comments !== null" 
                        color="blue-grey-lighten-3" 
                        size="16">
                        {{ 'mdi-comment-processing-outline' }}
                    </v-icon>
                  </template>
                </v-tooltip> 
                  <v-icon v-if="task.link !== null " color="blue-grey-lighten-3" size="16" @click="openLink(task.link)">{{ 'mdi-link-box-variant-outline' }}</v-icon>
                  <v-icon v-if="task.dev !== null " color="lime" size="16"  @click="openLink(task.dev)">{{ 'mdi-server-outline' }}</v-icon>
                  <v-icon v-if="task.homolog !== null " color="light-green" size="16"  @click="openLink(task.homolog)" >{{ 'mdi-server' }}</v-icon>
                  <v-icon v-if="task.prod !== null " color="green" size="16"  @click="openLink(task.prod)">{{ 'mdi-server-security' }}</v-icon>
                </span>

              </v-card-subtitle>
              
            </v-col>

           <v-col class="d-flex justify-end" cols="auto" style="padding-left: 13px;">
           
           <!-- bloco caso a interface seja celular -->
           <v-col v-if="isMobile">
            <v-switch
              :model-value="task.status_id === 2"              
              :color="task.color"
              hide-details
              
              :label = " task.status_id === 2 ? formattedTime : formatTime(task.time)"
              @update:model-value="(isOn) => switchStatus(task, isOn)"
            ></v-switch>
          </v-col>
  
             <!-- bloco caso a interface seja desktop -->
             <v-responsive v-else>
             <v-icon v-if="task.status_id === 1 && task.archived !== 1" 
                :color="colorIcons" 
                size="small" 
                @click="toggeStatus(task)">{{ 'mdi-play-box-outline' }}
              </v-icon>

              <v-icon v-if="task.status_id === 2"
                :color="task.color" 
                size="small" 
                class="mb-1 v-avatar--metronome"  
                @click="toggeStatus(task)">{{ 'mdi-pause-box-outline' }}
              </v-icon>

              <v-icon v-if="task.status_id == 1" 
                :color="colorIcons" size="small" 
                @click="archiveTask(task)">{{ !task.archived ? 'mdi-archive-outline' : 'mdi-archive-arrow-up-outline' }}
              </v-icon>

              <v-icon v-if="task.status_id == 1" 
                color="#E91E63" 
                size="small" 
                @click="deleteTask(task)">{{ 'mdi-trash-can-outline' }}
              </v-icon> 

            </v-responsive> 
            </v-col>  
             
            <!--  -->

          </v-row>
          {{ swipeDirection.none }}
        </v-card>
      </v-col>

    </v-row>
    <ModalAddTasks ref="modalAddTask" @refreshTasks="loadTasks" />

    <v-dialog v-model="isModalConfirm" transition="dialog-top-transition"
          width="auto">
      <v-card>
        <v-card-title>
          <span class="headline">Tem certeza?</span>
        </v-card-title>
        <v-card-actions>
          <v-btn color="error" @click="doDeleteTask()">Excluir</v-btn>
          <v-btn  @click="isModalConfirm = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.visible" :timeout="snackbar.timeout" :color="snackbar.color">
      <v-icon class="me-2">  {{ snackbar.icon }}</v-icon>
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.visible = false">
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
    

</template>

<script setup>
  import {ref, watch, onMounted, computed} from 'vue';
  import ModalAddTasks from './ModalAddTask.vue';
  import { useIsMobile } from '@/composables/useIsMobile';
  import db from '../db';

  // Definindo a prop recebida do componente pai
  const props = defineProps({
    archiveds: Boolean,
    selectedTask: String,
    colNum: {
      type: Number,
      required: true
    }
  });
  const isMobile = useIsMobile();

  // Estado
  const tasks = ref([]);
  const time = ref(0);
  const modalAddTask = ref(null);
  const intervalHandle = ref(null); // Declarar intervalHandle como um ref
  const snackbar = ref(
    {visible:false},
    {text:"Hello, I'm a snackbar"},
    {color:''},
    {timeout:1000},
    {icon:''}
    );
  // const snackbarText = ref("Hello, I'm a snackbar");
  // const snackbarColor = ref("");
  // const snackbarTimeout = ref(1000);
  // const snackbarIcon = ref();
  const taskId = ref('');
  const swipeDirection= ref('None');
  const colorIcons  = ref('indigo')

  const emit = defineEmits(['child-event']);
  const formattedTime = computed(() => {
    return formatTime(time.value); // Substitua "formatTime" pela sua função de formatação
  });


  const isModalConfirm = ref(false);
 
  function playVideo(){
    console.log('pressionadp')
  }
 function swipe(direction, task) {
 
        swipeDirection.value = direction
        console.log(direction)
        if(direction === 'Left') {
          archiveTask(task)
        } else {
          deleteTask(task)
        }
      }
  // Função para carregar tarefas
async function loadTasks() {
    
    let id_task = props.selectedTask
    let archived = props.archiveds

    try {
      if (id_task !== null) {
        tasks.value = await db.tasks.where('number').equals(id_task).toArray();
      } else {
            let status_id = archived ? 1 : 0
            tasks.value = await db.tasks.where('archived')
            .equals(status_id)
            .reverse()
            .sortBy('status_id');
     }
    } catch (error) {
      console.error('Erro ao carregar as tarefas:', error);
    }
  }

  function toggeStatus(task) {
    pauseAll()

    if (task.status_id == 1) {
      startTask(task)
    }
    loadTasks()
  }

  async function switchStatus(task, isOn){
    console.log(isOn)
    pauseAll()
      if (isOn) {
        await doStartTask(task); // Se a chave está ON, inicia a tarefa
      }
    
      loadTasks()
  }

  function truncate(text, maxLength) {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    } else {
      return text;
    }
  }

  function pauseAll() {
    showSnackbar(`Tarefa pausada`, 'lime')
    try {
      stopTimer()
      db.tasks.where('status_id').equals(2).modify({
        status_id: 1
      });

    } catch (error) {
      console.error('Erro ao atualizar o status das tarefas:', error);
    }
  }

  function startTask(task) {
    doStartTask(task)
  }

  async function doStartTask(task) {
    try {
      db.tasks.where('id').equals(task.id).modify({
        status_id: 2
      });
      
      showSnackbar(`Tarefa ${task.number} iniciada.`, 'lime')

      startTimer(task)
    } catch (error) {
      showSnackbar(`Erro ao iniciar a tarefa ${task.number}.`, '# ')
    }
  }

  function archiveTask(task) {
    try {
      let status = task.archived == 0 ? 1 : 0;
      let statusText = task.archived == 0 ? 'Arquivada' : 'Desarquivada';

      db.tasks.update(task.id, {
        archived: status,
        status_id: 1
      }).then(function (updated) {
        if (updated){
          showSnackbar(`Tarefa ${task.number} ${statusText}.`, 'lime',2000)
        }else{
          showSnackbar(`Erro ao arquivar a tarefa ${task.number}`, 'error','mdi-alert-circle', 3000)
        }
      });

      loadTasks()
    } catch (error) {
      showSnackbar(`Erro ao arquivar a tarefa ${task.number}`, 'error','mdi-alert-circle', 2000)
    }
  }
  
  async function startTimer(task) {

    await stopTimer();
    const startTime = Date.now();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; 
      time.value = task.time + elapsed;
       console.log('timer')
      if (Math.floor(elapsed) % 5 === 0) {
          updateTimeTask(task.id, Math.floor(time.value));
          emit('child-event',1)
      }

      intervalHandle.value = setTimeout(updateTimer, 1000); 
    };

    updateTimer();
  }

  async function stopTimer() {
    if (intervalHandle.value) {
      clearTimeout(intervalHandle.value);
      intervalHandle.value = null;
      console.log('Timer parado.');
    }
  }

  async function updateTimeTask(taskId, time) {
    try {
      await db.tasks.update(taskId, {
        time
      });

    } catch (error) {
      console.error('Erro ao atualizar o tempo da tarefa:', error);
    }
  }

  function formatTime(seconds) {
    seconds = Math.floor(seconds);  // Arredonda os segundos para baixo
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${days}:${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

	function clearTimeTask(task) {
    if(task.status_id == 1 && task.time > 0) {
        db.tasks.update(task.id, { time: 0 }).then((updated) => { 
        if (updated) {
          showSnackbar(`Contador da tarefa ${task.number} zerado.`, 'lime')
          loadTasks(); 
        } else {
        }
      }).catch((error) => {
      });
    } else {
      showSnackbar('Só é possivel zerar tarefas pausadas e com time maior que 0', '#FF5722', null, 5000)
    }
   
  }

  function deleteTask(task) {
    try {
      taskId.value = task.id
      isModalConfirm.value =  true;

    } catch (error) {
    }
  }

	function doDeleteTask() {
    try {
      db.tasks.delete(taskId.value);
      showSnackbar(`Tarefa deletada.`, 'lime')
      isModalConfirm.value =  false;
      loadTasks()

    } catch (error) {
    }
  }

  async function findAndHandleRunningTask() {
    tasks.value = await db.tasks.toArray();
    
    for (let task of tasks.value) {
        if (task.status_id == 2) {
              doStartTask(task)
            break; 
        }
    }

    loadTasks()
  }

  function handleDoubleClick(task) {
    if (modalAddTask.value) {
      modalAddTask.value.edit(task); // Chama o método open no componente filho
    }
  }

  function showSnackbar(text = 'Mensagem padrão', color = 'lime', icon = null, timeout = 1000) {
    icon = icon === null ? 'mdi-information-variant-box-outline' : icon
    // snackbarIcon.value = icon;
    snackbar.value.icon = icon;
    snackbar.value.text = text;
    snackbar.value.color = color;
    snackbar.value.timeout = timeout;
    snackbar.value.visible = true;
  }

  function copyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; 
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showSnackbar(`Copiado para área de transferencia.`, 'lime')
    } catch (err) {
      console.error('Erro ao copiar o texto: ', err);
    }
    document.body.removeChild(textArea);
  }

  function openLink(url) {
    if (url) {
      window.open(url, '_blank');
    } else {
      console.error('URL is undefined or null:', url);
    }
  }

  watch(() => props.selectedTask, (newVal) => {
    if (newVal) {
      loadTasks();
    }
  });

  watch(() => props.archiveds, (newVal) => {
      loadTasks(newVal);
  });

  onMounted(() => {
    loadTasks();
    findAndHandleRunningTask()
  });
  
  defineExpose({
	loadTasks, copyText, formatTime
});

</script>
<style>

  .v-avatar--metronome {
    animation-name: metronome-example;
    animation-duration: 1s; /* Duração da animação */
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    animation-direction: alternate;
  }

  .card-subtitle{
    padding-bottom: 7px;
    opacity: 1
  }
  .time{
    opacity: 0.5;
    padding-right: 10px;
  }

  @keyframes metronome-example {
  0% {
    transform: scale(1); /* Tamanho normal */
  }
  100% {
    transform: scale(1.2); /* Aumenta o tamanho */
  }
}
</style>