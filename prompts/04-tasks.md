Com base na Constitution, Specification e Plan, gere todas as tarefas necessárias para implementar o escopo definido para o MVP do projeto MySeizures.

As tarefas devem:

• possuir granularidade média;
• possuir dependências claras;
• seguir uma ordem lógica de implementação;
• ser agrupadas por módulos;
• indicar critérios objetivos de conclusão;
• ser adequadas para um projeto acadêmico de pequeno porte;
• evitar detalhamento excessivo;
• priorizar incrementos funcionais completos da aplicação, evitando tarefas excessivamente técnicas ou de baixo valor isoladamente.

Sempre que possível, cada tarefa deve representar uma entrega funcional que possa ser implementada, testada e validada de forma independente.

Organize as tarefas nos seguintes módulos:

1. Configuração
   • Estrutura inicial do projeto
   • Configuração do ambiente
   • Dependências

2. Banco de Dados
   • Modelagem
   • SQLite
   • Estrutura das tabelas
   • Relacionamentos

3. Domínio
   • Entidades
   • Regras de negócio
   • Casos de uso

4. Persistência
   • Repositórios
   • Operações CRUD
   • Armazenamento local

5. API
   • Serviços
   • Comunicação entre camadas
   • Validações

6. Interface
   • Navegação
   • Componentes reutilizáveis
   • Layout
   • Acessibilidade

7. Funcionalidades do Paciente
   • Registro de crises
   • Registro de gatilhos
   • Tratamentos
   • Aderência
   • Calendário

8. Funcionalidades do Médico/Cuidador
   • Acesso aos pacientes
   • Relatórios
   • Alertas

9. Notificações
   • Lembretes de medicação
   • Notificações locais

10. Relatórios
    • Consolidação dos dados
    • Gráficos
    • Indicadores clínicos

11. Alertas Clínicos
    • Identificação de padrões
    • Classificação de severidade

12. Exportação RNDS
    • Conversão para JSON
    • Geração do arquivo
    • Compatibilidade com o padrão RNDS/e-SUS

13. Testes
    • Testes unitários
    • Testes de integração
    • Validação dos principais fluxos da aplicação

14. Documentação
    • Atualização do README
    • Instruções de instalação
    • Documentação das decisões arquiteturais relevantes para o projeto

Ao final, apresente:

• a ordem recomendada de implementação dos módulos;
• as dependências entre eles;
• os marcos (milestones) sugeridos para o desenvolvimento do MVP;
• uma estimativa qualitativa de complexidade (baixa, média ou alta) para cada módulo.

Considere que este projeto é um Trabalho de Conclusão de Curso (TCC) cujo objetivo é entregar um protótipo funcional. Priorize simplicidade, organização, rastreabilidade e evolução incremental, evitando tarefas ou arquiteturas desnecessariamente complexas.