<template>
    <v-dialog v-model="dialog" max-width="600px" activator="#callModalAdd">
      <v-card>
        <v-card-title>{{ isEditing ? 'Editar' : 'Adicionar' }}</v-card-title>
        <v-card-text>
          <v-text-field hint="Número do chamado/tarefa" v-model="task.number" clearable label="Número"  ></v-text-field>
          <v-text-field hint="Breve resumo" v-model="task.summary" clearable label="Resumo"></v-text-field>
          <v-text-field v-model="task.color" clearable label="Cor" :style="{ color: task.color }" readonly >
            <template v-slot:append>
              <v-color-picker
                :swatches="swatches"
                disabled
                hide-canvas
                hide-inputs
                show-swatches
                v-model="task.color"
                @input="applyColorToNumberInput"
              ></v-color-picker>
            </template>
          </v-text-field>
          <v-expansion-panels
            v-model="panel"
            :disabled="disabled"
          >
          <v-expansion-panel>
        <v-expansion-panel-title>Mais opções</v-expansion-panel-title>
        <v-expansion-panel-text expand-icon="mdi-menu-down">
          <v-text-field hint="Link do chamado/tarefa" v-model="task.link" clearable label="Link"></v-text-field>
          <v-text-field hint="Link do deploy homologação"  v-model="task.dev" clearable label="Dev"></v-text-field>
          <v-text-field hint="Link do deploy homologação do cliente"  v-model="task.homolog" clearable label="Homolog"></v-text-field>
          <v-text-field hint="Link do deploy produção"  v-model="task.prod" clearable label="Prod"></v-text-field>
          <v-textarea hint="Comentários/anotações"v-model="task.comments" clearable label="Comments"></v-textarea>
        </v-expansion-panel-text>
      </v-expansion-panel>
      </v-expansion-panels>
        
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="saveTask">
            {{ isEditing ? 'Alterar' : 'Salvar' }}
          </v-btn>
          <v-btn text @click="close">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
    import { ref } from 'vue';
    import db from '../db';
    
    const dialog = ref(false);
    const isEditing = ref(false);
    const panel = ref([]);
    const disabled = ref(false);
    const swatches = ref([
      ['#FF0000', '#AA0000', '#550000'],
      ['#FFFF00', '#AAAA00', '#555500'],
      ['#00FF00', '#00AA00', '#005500'],
      ['#00FFFF', '#00AAAA', '#005555'],
      ['#0000FF', '#0000AA', '#000055'],
      ['#F44336', '#E91E63', '#9C27B0'],
      ['#673AB7', '#3F51B5', '#2196F3'],
      ['#FFEB3B', '#FFC107', '#FF9800'],
      ['#FF5722', '#795548', '#607D8B'],
      ['#4CAF50', '#8BC34A', '#CDDC39'],
,
      
    ]);
    const task = ref({
      name: '',
      number: '',
      archived: '',
      summary: '',
      color: '',
      link: '',
      dev: '',
      homolog: '',
      prod: '',
      comments: '',
    });
    
const emit = defineEmits(['refreshTasks']); // Declare os eventos aqui

    defineExpose({
      open() {
        dialog.value = true;
      },
      close() {
        dialog.value = false;
      },
      edit(_task) {
        task.value.id = _task.id; // Atribui o ID da tarefa para edição
        task.value.name = _task.name || '';
        task.value.number = _task.number || '';
        task.value.archived = _task.archived || false;
        task.value.summary = _task.summary || '';
        task.value.color = _task.color || '';
        task.value.link = _task.link || '';
        task.value.dev = _task.dev || '';
        task.value.homolog = _task.homolog || '';
        task.value.prod = _task.prod || '';
        task.value.comments = _task.comments || '';

        isEditing.value = true; // Marca que está em modo de edição
        dialog.value = true;
      }
    });
    
    function close() {
      dialog.value = false;
    }
    
    async function saveTask() {
        const simplifiedTask = {
          time:                         0,
          total_time:                   0,
          order:                        0,
          status_id:                    1,
          archived:                     task.value.archived || 0,
          name: task.value.name,
          number: task.value.number,
          summary: task.value.summary   || '?',
          color: task.value.color       || null,
          link: task.value.link         || null,
          dev: task.value.dev           || null,
          homolog: task.value.homolog   || null,
          prod: task.value.prod         || null,
          comments: task.value.comments || null,
        };

  try {
    if (isEditing.value && task.value.id) {
      const { time, ...updatedTask } = simplifiedTask;
      await db.tasks.update(task.value.id, updatedTask)
    .then(() => {
    
    });
      
      isEditing.value = false; // Corrigido o operador de atribuição
 
    } else {
      await db.tasks.add(simplifiedTask);
     
    }

    close();
  } catch (error) {
    console.error('Erro ao salvar a tarefa:', error);
  }
  emit('refreshTasks', task.value);
}



    const applyColorToNumberInput = (color) => {
      task.value.color = task.value.color; // Atualiza a cor, se necessário
    };
  </script>
  
  <style>
/* Ocultar a barra de controle do color picker */
.v-color-picker__controls {
  display: none !important;
}
@keyframes pulse {
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
}

.icon-pulse {
  animation: pulse 1.5s infinite;
}

.icon-pulse-1 {
  animation-delay: 0s;
}

.icon-pulse-2 {
  animation-delay: 0.5s;
}

.icon-pulse-3 {
  animation-delay: 1s;
}
</style>