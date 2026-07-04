# Implementação de Sistemas de Progressão e Consequência

Quero que você implemente os sistemas abaixo utilizando a arquitetura já existente do projeto, seguindo boas práticas de engenharia de software (código limpo, desacoplado, reutilizável e escalável). Antes de criar qualquer lógica nova, reutilize ao máximo os sistemas e eventos já existentes.

## Objetivo Geral

Adicionar três pilares ao jogo:

1. Progressão baseada em objetivos.
2. Consequências permanentes para as ações do jogador.
3. Lore integrada às mecânicas do jogo.

Não quero soluções temporárias (gambiarras). A implementação deve ser definitiva, modular e preparada para expansão futura.

---

# 1. Sistema de Missões com Rastreamento Automático

## Objetivo

Criar um sistema de missões totalmente baseado em eventos do jogo, sem necessidade de scripts específicos para cada missão.

O sistema de dungeon já dispara eventos de kill. Utilize esses eventos como fonte principal para atualização automática do progresso.

## Requisitos

Implementar um sistema de objetivos mensuráveis, como:

* matar X inimigos;
* matar um tipo específico de inimigo;
* concluir uma dungeon;
* derrotar um boss;
* coletar determinada quantidade de itens;
* entregar itens;
* conversar com NPC específico;
* visitar determinada área;
* qualquer outro objetivo facilmente expansível.

## Arquitetura

O sistema deve ser orientado a eventos.

Exemplo de fluxo:

Evento do jogo
↓

Mission Manager
↓

Atualização do progresso
↓

Verificação de conclusão
↓

Entrega de recompensa

Não quero verificações por polling.

A missão deve apenas se inscrever nos eventos necessários.

## Estrutura

Cada missão deve possuir:

* ID
* Nome
* Descrição
* Objetivos
* Estado (Bloqueada / Disponível / Em andamento / Concluída / Recompensa recebida)
* Recompensas
* Pré-requisitos
* Flags de progressão

Cada objetivo deve conter:

* tipo
* alvo
* quantidade
* progresso atual
* concluído (bool)

## Persistência

Salvar progresso automaticamente.

Ao sair e entrar no jogo, tudo deve permanecer exatamente no estado anterior.

## Interface

Adicionar interface mostrando:

* lista de missões;
* progresso em tempo real;
* objetivos concluídos;
* recompensa disponível;
* missão finalizada.

Sempre que um objetivo for atualizado, a interface deve refletir imediatamente.

---

# 2. Sistema de Consequências Permanentes

O jogo atualmente não possui consequências significativas.

Isso precisa mudar.

As decisões do jogador devem gerar estados permanentes.

Implemente a infraestrutura para isso.

## Sistema de Estados Globais

Criar um sistema de Game Flags.

Exemplos:

HasKilledVillageChief

JoinedFactionA

JoinedFactionB

DestroyedBridge

SavedMerchant

PlayerExecutedNPC

Etc.

Essas flags devem ser persistidas no save.

Qualquer sistema do jogo deve conseguir consultá-las.

---

## Consequências Mecânicas

Implementar suporte para consequências permanentes como:

### Facções

Entrar em uma facção pode bloquear definitivamente outra.

Exemplo:

Entrou na Guilda dos Magos

↓

Não pode entrar na Ordem dos Cavaleiros

Esses estados devem ser permanentes.

---

### Penalidade de Morte

Adicionar suporte para penalidade de morte.

A arquitetura deve permitir configurar facilmente:

* perda de XP;
* perda de ouro;
* perda de durabilidade;
* respawn específico.

Mesmo que inicialmente apenas uma penalidade seja utilizada, quero a infraestrutura preparada.

---

### Durabilidade de Itens

Implementar sistema de durabilidade.

Itens devem possuir:

* durabilidade atual;
* durabilidade máxima;
* perda de durabilidade em uso.

Quando chegar a zero:

* o item quebra;
* deixa de funcionar;
* somente pode voltar após reparo (caso exista esse sistema futuramente).

Estruture para futura integração com NPCs de reparo.

---

# 3. Lore Integrada às Mecânicas

A narrativa não deve ser apenas texto.

Ela deve responder às escolhas do jogador.

Quero um sistema de condições para diálogos, NPCs, quests e eventos.

## Sistema de Condições

Todo conteúdo deve poder possuir condições como:

Requer Flag X

Não possuir Flag Y

Pertencer à Facção A

Ter completado Missão B

Ter nível mínimo

Ter derrotado Boss C

Ter realizado Evento D

As condições devem ser genéricas.

Nada hardcoded.

---

## NPCs

NPCs devem poder:

* mudar diálogo;
* liberar quests;
* bloquear quests;
* vender itens diferentes;
* atacar o jogador;
* ignorar o jogador.

Tudo baseado nas Game Flags.

---

## Missões

Missões devem poder:

* aparecer;
* desaparecer;
* mudar recompensa;
* mudar objetivo;
* falhar permanentemente.

Tudo baseado nas escolhas do jogador.

---

## Mundo

Eventos do mundo também devem responder às escolhas.

Exemplos:

ponte destruída;

cidade diferente;

NPC desaparecido;

mercador morto;

chefes substituídos;

novas áreas abertas.

Tudo utilizando o sistema de Game Flags.

---

# 4. Requisitos de Arquitetura

Quero código altamente modular.

Separar claramente:

* Mission System
* Objective System
* Event Listeners
* Reward System
* Game Flags
* Consequence System
* Faction System
* Dialogue Conditions
* World State Manager

Evitar dependências circulares.

Usar interfaces quando necessário.

Não duplicar lógica.

Toda regra de negócio deve ficar fora da UI.

---

# 5. Persistência

Todos os sistemas devem ser serializados no save:

* missões;
* progresso;
* flags;
* facções;
* estados permanentes;
* durabilidade;
* consequências.

Ao carregar o save, o mundo deve ser reconstruído exatamente como estava.

---

# 6. Escalabilidade

A implementação deve permitir adicionar novos:

* tipos de missão;
* objetivos;
* consequências;
* condições;
* facções;
* estados globais;
* recompensas.

Sem necessidade de alterar código existente, apenas adicionando novos dados ou componentes.

---

# Resultado Esperado

Ao final da implementação, o jogo deve possuir:

* Sistema de missões automático baseado em eventos.
* Rastreamento automático de progresso.
* Persistência completa.
* Sistema global de Game Flags.
* Sistema de consequências permanentes.
* Sistema de facções com exclusividade.
* Sistema de durabilidade.
* Penalidade de morte configurável.
* Lore integrada às mecânicas.
* NPCs e mundo reagindo às escolhas do jogador.
* Arquitetura limpa, modular, desacoplada e preparada para expansão futura.

Se durante a implementação houver necessidade de refatoração para manter a arquitetura consistente, realize-a. Priorize qualidade, manutenção e escalabilidade em vez de soluções rápidas.
