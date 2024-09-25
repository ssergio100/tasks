<template>
  
  <div class="icon-container" v-if="isVisible">
      <v-icon color="#AAAA00" size="8">{{ 'mdi-circle' }}</v-icon>
    </div>
  <v-container>
    <v-row>

      <v-col cols="12" md="6" float-right v-if="showSearcTask">
        <v-autocomplete 
          clearable 
          v-model="selectedTask" 
          label="Buscar" 
          :items="taskNumbers" 
          item-value="number"
          color="#AAAA00"
          variant="outlined"
          item-text="number">
        </v-autocomplete>
      </v-col>
    </v-row>
    
    <v-dialog v-model="isModalOpen" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="headline">Exportar e Importar Dados</span>
        </v-card-title>
        <v-card-subtitle>
          <v-textarea hint="Copie o json" label="Dados Atuais (JSON)" v-model="currentData" readonly rows="5" auto-grow></v-textarea>
          <v-textarea hint="Cole o json aqio para restaurar as tarefas" label="Colar Dados (JSON para Importação)" v-model="importData" rows="5" auto-grow
            @input="handlePaste"></v-textarea>
        </v-card-subtitle>
        <v-card-actions>
          <v-btn color="primary" @click="exportData">Exportar Dados</v-btn>
          <v-btn color="success" @click="importDataFromText">Importar Dados</v-btn>
          <v-btn color="error" @click="isModalOpen = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ModalAddTasks ref="modalAddTask" @refreshTasks="refreshTasks" />
    <TaskList 
      ref="taskList" 
      :archiveds="archiveds" 
      :colNum="colNum" 
      :selected-task="selectedTask" 
      @child-event="handleChildEvent"
    />

  </v-container>


  <div class="footer-actions text-center">
    <v-menu>
      <template v-slot:activator="{ props: activatorProps }" >
        <v-icon v-bind="activatorProps">mdi-menu</v-icon>
      </template>

      <v-tooltip text="Alternar tema" location="top">
        <template v-slot:activator="{ props }">
          <v-btn value="status" @click="toggleTheme" v-bind="props" style="margin: 3px">
            <v-icon :color="isDarkMode ? 'blue-grey-lighten-3' : 'blue-grey-lighten-3'">
              {{ isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}
            </v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip text="Procurar task" location="top">
        <template v-slot:activator="{ props }">
          <v-btn value="status" @click="showSearcTask = !showSearcTask" v-bind="props" style="margin: 3px">
            <v-icon>mdi-selection-search</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
      
      <v-tooltip text="Adicionar tarefa" location="top">
        <template v-slot:activator="{ props }">
          <v-btn value="add" v-bind="props" @click="openModal" style="margin: 3px">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip text="Esportar/Importar tarefas" location="top">
        <template v-slot:activator="{ props }">
          <v-btn value="export" v-bind="props" @click="exportTasks" style="margin: 3px">
            <v-icon>mdi-database-refresh-outline</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip :text="!archiveds ? 'Ver arquivadas' : 'Ver Ativas'" location="top">
        <template v-slot:activator="{ props }">
          <v-btn value="status" v-bind="props" @click="toggleView" style="margin: 3px">
            <v-icon>mdi-archive-outline</v-icon>
            
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip :text="colNum === 6 ? 'Uma coluna' : 'Duas colunas'" location="top">
        <template v-slot:activator="{ props }">
          <v-btn value="status" v-bind="props" @click=" colNum = colNum === 6 ? 12 : 6;" style="margin: 3px">
            <v-icon v-if="colNum === 6">mdi-format-align-justify</v-icon>
            <v-icon v-if="colNum === 12">mdi-format-columns</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

 
    </v-menu>
  </div>

  



</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue';
  import {
    useTheme
  } from 'vuetify';
  import ModalAddTasks from './ModalAddTask.vue';
  import TaskList from './TaskList.vue';
  import db from '../db';

  const theme = useTheme();
  const isDarkMode = ref(theme.global.current.value.dark);
  const colNum = ref(12);
  const showSearcTask = ref(false);
  const modalAddTask = ref(null);
  const archiveds = ref(false);
  const isModalOpen = ref(false);
  const currentData = ref('');
  const importData = ref('');
  const taskList = ref(null);
  const tasks = ref([]);
  const taskNumbers = ref([]);
  const selectedTask = ref(null);

  onMounted(() => {
    _loadTasks();
  });


  const isVisible = ref(false);

function handleChildEvent(payload) {
  console.log('Evento recebido do filho:', payload);
  showIconTemporarily();
}

function showIconTemporarily() {
  isVisible.value = true; // Torna o ícone visível
  setTimeout(() => {
    isVisible.value = false; // Esconde o ícone após 500 ms
  }, 500);
}

  async function _loadTasks() {
    tasks.value = await db.tasks.toArray();
    taskNumbers.value = tasks.value.map(task => task.number);
  }

  async function exportData() {
    try {
      const tasks = await db.tasks.toArray();
      currentData.value = JSON.stringify({
        tasks
      }, null, 2);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  }

  async function importDataFromText() {
    try {
      const parsedData = JSON.parse(importData.value);
      if (parsedData.tasks) {
        alert('Importado');
        await db.transaction('rw', db.tasks, async () => {
          await db.tasks.clear(); // Limpa dados antigos
          await db.tasks.bulkAdd(parsedData.tasks); // Adiciona novos dados
        });
        isModalOpen.value = false;
      } else {
        alert('Formato de dados inválido.');
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      alert('Erro ao importar dados. Verifique o formato.');
    }
  }

  function openModal() {
    if (modalAddTask.value) {
      modalAddTask.value.open();
    }
  }

  async function toggleTheme() {
    const newTheme = theme.global.current.value.dark ? 'light' : 'dark';
    theme.global.name.value = newTheme;
    isDarkMode.value = newTheme === 'dark';

    try {
      await db.config.update('theme', {
        value: newTheme
      });
      console.log('Tema salvo no IndexedDB:', newTheme);
    } catch (error) {
      console.error('Erro ao salvar o tema no IndexedDB:', error);
    }
  }

  function toggleColNum() {
    colNum.value = colNum.value === 6 ? 12 : 6; // Alterna entre 6 e 12
  }

  function toggleView() {
    archiveds.value = !archiveds.value
    //console.log(archiveds.value)
  };

  
  function exportTasks() {
    isModalOpen.value = true
  }

  function refreshTasks() {
    taskList.value.loadTasks();
  }


</script>

<style>
.icon-container {
  position: fixed; /* Fixa o ícone na tela */
  left: 10px; /* Distância da esquerda */
  z-index: 1000; /* Garante que fique acima de outros elementos */
}

.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  z-index: 1000; /* Para garantir que esteja acima de outros conteúdos */
}

</style>
