# ADR 0003: Reposicionar a interoperabilidade com o Ecossistema SUS

- **Status:** Proposto
- **Data:** 2026-10-20
- **Decisores:** Henrique Cordeiro (autor) · orientador do TCC

## Contexto

A **Matriz de Concorrência** (`docs/fix_pesquisa_TCC.pdf`) apresenta, para a coluna *Meu
sistema*, a funcionalidade **"Integração com o Ecossistema SUS"** marcada como presente — sendo a
única coluna da tabela em que todos os quatro concorrentes (Epsy, Seizure Tracker, Epilepsy
Journal, Epistemic) estão marcados como **ausentes**. A mesma matriz afirma, no bloco "Detalhes
sobre as Funcionalidades", que o projeto teria *"exportação de dados em formatos compatíveis com
o e-SUS/RNDS"*.

Ao mesmo tempo, ao longo do desenvolvimento chegou-se à conclusão de que a **integração direta**
com esses sistemas não é alcançável no escopo de um TCC individual. As razões são técnicas e
institucionais, não de esforço:

1. **RNDS** é uma rede de interoperabilidade com credenciamento de estabelecimento de
   saúde, governada pelo Ministério da Saúde. Não há, para o desenvolvedor individual, fluxo de
   homologação público nem credencial de desenvolvedor.
2. **e-SUS APS** expõe API que requer convênio municipal e exige ontologia própria, além de
   autenticação no diretório da gestão municipal. Não há sandbox público.
3. **Não existe produto mobile de terceiros** no ecossistema SUS com integração direta — o modelo
   institucional vigente é o prontuário no posto de saúde, com o paciente como consumidor
   indireto.
4. A integração direta exigiria também criptografia, auditoria, retenção regulada e tratamento de
   incidentes de segurança, todos fora do escopo de um protótipo acadêmico.

Isso cria uma **contradição verificável** entre uma afirmação pública (a matriz) e o
implementável. O ADR 0002 já havia decidido — corretamente — que o app **não** transmite dados
para fora e que o export é um **artefato local versionado**, para registro manual pelo
profissional. A linha da matriz, porém, continua sendo redigida como "integração", o que sugere
uma capacidade que o sistema não tem e não terá.

O `traceability.md` do T055 registra o achado: **FR-013 (offline) parcial** e a matriz de
concorrência não referenciada pela rastreabilidade. A orientação do orientador foi, na essência:
*"você está distante da proposta"*.

## Decisão

**O escopo de interoperabilidade com o Ecossistema SUS do MySeizures passa a ser definido em
três níveis, e a proposta pública passa a declarar explicitamente qual deles o projeto entrega:**

| Nível | Definição | Viabilidade | Status do MySeizures |
|---|---|---|---|
| **L1 — Transmissão direta** | O app envia dados ao RNDS / e-SUS | **Inviável** — credenciamento institucional, sem sandbox público, obrigações reguladas | Fora de escopo, permanentemente |
| **L2 — Compatibilidade estrutural** | O app produz um artefato com estrutura mapeada, versionada e documentada, para registro manual pelo profissional | **Viável e entregue** | **Implementado** (`formatVersion: "1.0"`, allow-list, contrato testado) |
| **L3 — Interoperabilidade bidirecional** | Sincronização de dados entre app e prontuário | Fora de escopo | Fora de escopo |

**Consequências imediatas:**

1. A **Matriz de Concorrência** é reemitida com a linha 13 redigida como **"Compatibilidade
   estrutural com e-SUS/RNDS (export versionado, sem transmissão)"**, e passa a ser apresentada em
   **dois níveis**: *visão do produto* (13/13) e *estado da v1* (marcação honesta em três
   níveis: `✔ implementado` / `◐ parcial` / `✔ estrutural`). A coluna *Meu sistema* **mantém o
   ✔** — e continua sendo a única coluna com marcação nessa linha.
2. A **promessa pública** passa a ser verificável no código: cada linha marcada como implementada
   tem artefato, teste e rastreabilidade correspondentes.
3. Um **ADR 0004** é previsto para registrar, quando o escopo da interoperabilidade for
   reavaliado, qualquer passagem de L2 para L3.

## Consequências

### Positivas

- **A afirmação pública passa a ser verdadeira.** A matriz deixa de ser um documento de
  propaganda e passa a ser um instrumento de comparação verificável — o que é exatamente o que
  a banca exige.
- **A diferenciação competitiva é preservada.** Os quatro concorrentes são ❌ nessa linha. O
  MySeizures continua sendo o único com marcação, agora por um motivo que o código sustenta.
- **A compatibilidade estrutural é, na prática, o que o RNDS exige de um app de terceiros.** O
  app não integra: gera artefato. Essa é a leitura correta do modelo institucional vigente.
- **Reduz o risco de defesa.** Um avaliador que abre o repositório e não encontra transmissão
  direta encontra, em vez disso, um mapper com allow-list, um contrato versionado e testes de
  exclusão de credenciais — evidência de maturidade, não de ausência.

### Trade-offs e riscos

- **O termo "integração" desaparece da proposta.** A linha reformulada é menos chamativa, e
  pode ser percebida como recuo. A mitigação é a **evidência**: o export é demonstrável em 2
  minutos e o mapeamento campo-a-campo é documentado.
- **Existe o risco de a reescrita da matriz ser lida como adulteração do documento de pesquisa.**
  A mitigação é **manter as duas colunas** — a visão original permanece intacta e visível; a coluna
  de estado da v1 é adicional.
- **Trabalhos futuros de L3 ficam explicitamente fora**, o que significa que nenhum plano futuro
  deve prometer integração direta sem resolver credenciamento e sandbox antes.

## Alternativas consideradas

- **Manter a linha como "Integração com o Ecossistema SUS" e tentar implementar L1**: rejeitada
  porque é tecnicamente inviável (credenciamento institucional, ausência de sandbox público) e
  porque manter a afirmação criaria um passivo de credibilidade frente à banca.
- **Remover a linha 13 da matriz**: rejeitada porque o MySeizures **entrega** alguma coisa nessa
  dimensão — a compatibilidade estrutural é real, testada e superior à ausência dos
  concorrentes. Remover desperdiça a única marcação exclusiva da tabela.
- **Substituir por "N/A"**: rejeitada porque apaga um diferencial real.
- **Implementar um importador de arquivo RNDS/e-SUS (L2 invertido)**: rejeitada por ora — é
  trabalho real, mas não bloqueia a proposta, e a prioridade da sprint é a interface de baixo
  esforço (ver `docs/pmv-outubro-2026.md`, R7/R3). Pode ser reavaliada após a entrega de outubro.
- **Trocar o protótipo por uma integração real com um prontuário municipal parceiro**: rejeitada
  por dependência institucional fora do controle do autor e por ausência de prazo.

## Referências

- `docs/adr/0001-local-clinical-source-of-truth.md` — fonte de verdade local
- `docs/adr/0002-derived-reports-alerts-and-local-export.md` — alertas versionados, export local
- `specs/001-manage-epilepsy-care/contracts/export-json.md` — contrato de export v1.0
- `specs/001-manage-epilepsy-care/spec.md` — FR-012, FR-013 e as *Business Rules*
- `docs/fix_pesquisa_TCC.pdf` — Matriz de Concorrência
- `docs/plano-geral-outubro-2026.md` §8 — escopo dentro e fora da sprint
