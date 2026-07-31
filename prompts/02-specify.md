Desejo criar a especificação funcional do projeto MySeizures.

O objetivo é desenvolver um aplicativo mobile destinado ao acompanhamento remoto e ao manejo clínico de pacientes adultos com epilepsia, como um protótipo funcional para fins acadêmicos (TCC). Algumas funcionalidades serão simuladas e determinadas integrações externas não serão implementadas diretamente.

Não faz parte deste protótipo:

• sincronização em nuvem
• autenticação biométrica
• integração direta com RNDS
• integração com prontuários eletrônicos
• notificações em smartwatch
• suporte multiplataforma desktop

Stack tecnológica:

• React Native (JavaScript)
• SQLite
• API REST em JavaScript
• Arquitetura offline-first

A aplicação possui dois perfis principais:

• Paciente
• Médico/Cuidador

Objetivos principais:

• registrar crises epilépticas
• registrar gatilhos
• controlar tratamentos
• controlar aderência medicamentosa
• gerar lembretes
• gerar relatórios
• emitir alertas clínicos
• compartilhar informações entre paciente e profissional
• exportar dados em JSON compatível com RNDS/e-SUS

Modelo conceitual inicial do domínio:

### User (classe base) 
Atributos: idUser (int), name (string), email (string), password (string) 
Método: authenticate() 
Observação: classe abstrata. Patient e MedicCaretaker herdam de User.
 
### Patient (herda de User) 
Atributos: idPatient (int), birthDate (Date), diagnosisDate (Date) 
Método: grantAccess(MedicCaretaker) 
Relacionamentos: - Composição com RegisterSeizure (0..*) - Composição com RegisterTrigger (0..*) - Composição com Treatment (1) - Associação com MedicCaretaker (0..*)
 
### MedicCaretaker (herda de User) 
Atributos: professionalRegister (int), professionalLink (string) 
Método: accessReport(idPatient)
 
### RegisterSeizure 
Atributos: idSeizure (int), dateHourOccurrence (DateTime), occurrenceType (enum) 
Relacionamento: composto por Patient 

### RegisterTrigger 
Atributos: idTrigger (int), dateHourRegister (DateTime), commonCause (enum), descriptionOthers (string) 
Relacionamentos: - Composto por Patient - Composição com TriggerDetails (1) 

### TriggerDetails 
Atributos: date (Date), sleepQuality (int), mood (int) 
Relacionamento: composto por RegisterTrigger 

### Treatment 
Atributos: type (enum), name (string), dailyFrequency (int), baseHoraries (String[]) 
Método: generateFutureReminders() 
Relacionamentos: - Composto por Patient - Composição com Reminder (1..*) 

### Reminder 
Atributos: idReminder (int), dateHourProgrammed (DateTime), notificationStatus (boolean) 
Método: triggerNotificationPush() 
Relacionamentos: - Composto por Treatment - Associação com Adherence (0..*) 

### Adherence 
Atributos: dateHourConfirmation (DateTime), consumptionStatus (enum) 
Relacionamento: associado a Reminder 

### Report 
Atributos: idReport (int), startDate (Date), endDate (Date), globalAdherenceRate (float) 
Métodos: compileRecords(), generateTriggerGraphics(), evaluateClinicAlerts() 
Relacionamentos: - Agregação com RegisterTrigger - Agregação com RegisterSeizure - Dependência (use) com ExporterSUS - Associação com ClinicAlert 

### ClinicAlert 
Atributos: idAlert (int), severityLevel (enum), reason (string) 
Relacionamento: associado a Report 

### ExporterSUS 
Atributos: standardFormat (string) Métodos: convertData(Report), transmitToRNDS() 
Observação: gera arquivos JSON compatíveis com os padrões da RNDS e do e-SUS. Não há integração direta com o sistema do governo — o arquivo gerado é enviado ao profissional de saúde, que realiza as atualizações necessárias.

Requisitos Funcionais:

- RF01 - Registro de crises epilépticas (data, hora, tipo de ocorrência) 
- RF02 - Registro de gatilhos com detalhamento (sono, humor, causa) 
- RF03 - Cadastro de tratamentos (tipo, nome, frequência diária, horários base) 
- RF04 - Emissão de lembretes de medicação conforme tratamento cadastrado 
- RF05 - Registro de confirmação de aderência pelo paciente 
- RF06 - Monitoramento contínuo de indicadores de gatilho (sono, humor, rotina) 
- RF07 - Calendário com visualização cronológica de eventos registrados 
- RF08 - Geração de relatórios periódicos com gráficos (semanal, mensal, anual) 
- RF09 - Integração entre paciente, médico e/ou cuidador com acesso compartilhado 
- RF10 - Emissão de alertas clínicos ao médico/cuidador por padrões de risco 
- RF11 - Autenticação de usuários com controle de acesso por perfil 
- RF12 - Concessão e revogação de acesso pelo paciente a médicos/cuidadores 
- RF13 - Exportação de dados clínicos em JSON compatível com RNDS/e-SUS

Requisitos Não Funcionais:

RNF01 - Arquitetura offline-first com banco de dados local (SQLite) 
RNF02 - Interface de baixo esforço cognitivo, acessível a pacientes com limitações neurológicas 
RNF03 - Notificações integradas ao sistema operacional do dispositivo (SO Mobile) 
RNF04 - Proteção dos dados clínicos com controle de acesso por perfil de usuário 
RNF05 - Exportação em formato JSON estruturado, compatível com padrões RNDS

Além dos requisitos acima, identifique:

• fluxos principais do sistema;
• regras de negócio implícitas;
• possíveis ambiguidades;
• dependências entre funcionalidades;
• critérios de aceitação sugeridos para cada requisito funcional.

Não proponha implementação nesta etapa.