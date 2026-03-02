# PLAN: Melhorias de Arquitetura (Clean Architecture & Repository Pattern)

## Objetivo

Analisar o diretório `src/` e propor melhorias usando conceitos de Clean Architecture, RESTful API design e Repository Pattern, focado na melhoria da capacidade de manutenção, isolamento de camadas e testabilidade.

## 1. Análise Atual do `src/`

Estrutura atual:

- `routes/`: Define as rotas Fastify e chama os Use Cases ou inclui a lógica dos endpoints de forma procedural.
- `usecases/`: Contém a regra de negócio. Porém, acessa o Prisma de forma direta (`import { prisma } from '../lib/db.js'`).
- `schemas/`: Interface e validações Zod.
- `errors/`: Exceções personalizadas.
- `lib/`: Módulos de infra (DB, App, Auth).

**Problema Arquitetural:** Há um forte **acoplamento com a infraestrutura (Prisma e Banco de Dados)**. Os casos de uso de negócio orquestram a lógica interativa (O quê a aplicação faz) misturadas intimamente com o mecanismo (Como buscar/salvar os dados e realizar transações).

---

## 2. Melhorias Recomendadas (REST / Clean Arch)

### 2.1 Padrão REST e Semântica HTTP

- A API está muito boa, mas pode se beneficiar de purismos. Em APIs REST, tratamos Endpoints como "Recursos" (Ex: `/users/me/dashboard`). Recursos são substantivos.
- Em _Clean Architecture_, garantimos que o _Delivery Mechanism_ (APIs HTTP, Mensageria, CLI) seja um detalhe. Para aprimorar isso, a responsabilidade de interpretar a Requisição (_Request_) e formar a Resposta (_Reply_) deveria sair de `routes/` e ir para **Controllers**. As rotas atuariam apenas como mapeamentos (`fastify.get('/route', UserController.handle)`).

### 2.2 Inversão de Dependências (DIP) e Separação de Camadas

Os UseCases não deveriam "puxar" recursos usando `import` global, eles devem "receber" interfaces (Contratos).

- Se a classe de UseCase recebe os serviços de Database no seu Construtor, alcançamos o _Dependency Injection_. A lógica de negócio passa a depender de abstrações em vez de depender de detalhes de implementação (Letra 'D' do SOLID).

---

## 3. O Padrão Repository

### O que é?

O Repositório atua como uma camada mediadora baseada em coleções entre a lógica de domínio (business layer) e o banco de dados. Os repositórios declaram _contratos (interfaces)_ contendo métodos que têm semântica do domínio, não semântica do banco. (Ex: Ao invés de `prisma.user.findFirst`, usaríamos `repository.findByEmail`).

### Melhorias e Possibilidades Diretas

1. **Testabilidade Unitária Imbatível (Sem Depender de Mocks Bizarros)**
   - Atualmente, como vimos, criar mock do Prisma é trabalhoso, requerendo manipulações no motor de teste (`vi.mock`, `vi.hoisted`).
   - Com repositórios, para os testes de unidade, você passa um **In-Memory Repository** (uma classe que guarda dados em instâncias nativas de Array). Seus testes rodam em submilisegundos, não quebram conforme o banco mexe, e ficam muito mais fáceis de ler.

2. **Isolamento à Prova de Refatorações**
   - Quer trocar o banco Postgres por MongoDB? Quer trocar o ORM do Prisma pelo Drizzle (porque o Prisma ficou pesado no Cold Start de Serverless)?
   - Você precisará modificar apenas os arquivos dentro da pasta `repositories/...`, mantendo a pasta de `usecases/...` completamente inalterada.

3. **Segurança e Encapsulamento de Transações (Orquestração)**
   - O repositório centralizado impede que queries complexas e vitais para o negócio repitam "cláusulas where" iguais em vários lugares da base de código. Se a modelagem de como você detecta se um Plano "está ativo" muda, você só altera o método `findActivePlan(userId)` do Repositório.

---

## 4. Plano de Ação Estruturado (Roadmap de Implementação)

Caso deseje seguir por este caminho para limpar e tornar a arquitetura robusta:

### Fase 1: Interfaces e Padrão Repositório

- [ ] Criar os diretórios `src/repositories/interfaces` e `src/repositories/prisma`.
- [ ] Extrair contratos fundamentais em interfaces TypeScript: `IWorkoutPlanRepository`, `ISessionRepository`, `IUserTrainRepository`, etc.
- [ ] Implementar o código do Prisma utilizando as interfaces e criando o Repositório persistente.

### Fase 2: Injeção de Dependência nos Use Cases

- [ ] Refatorar as classes de Use Cases adicionando construtores (`constructor(private workoutRepo: IWorkoutPlanRepository)`).
- [ ] Substituir todas as chamadas `prisma.model...` pelos métodos do repositório respectivo.

### Fase 3: Criação dos Controllers e Factory Root

- [ ] Extrair lógicas de Request/Reply das rotas atuais (`routes/`) para as classes dentro de `src/controllers/`.
- [ ] Fazer uma amarração primária (Composer Factory) onde nós instanciamos `Repositório -> UseCase -> Controller` injetados dinamicamente para cada rota no Boot do Servidor.

### Fase 4: Otimização de Testes

- [ ] Criar pseudo-repositórios em memória (`InMemoryWorkoutPlanRepository`) dentro da pasta dos testes.
- [ ] Remover ou reduzir drasticamente o complexo mocking do prisma unitário e testar focado ao negócio com arrays em memória.

---

## 🛑 Socratic Gate (Perguntas de Alinhamento)

Antes de aplicarmos qualquer tipo de refatoração, por favor, me responda:

1. **Injeção de Dependências:** Para a Fase 3, você prefere adotar uma biblioteca de Di/IoC (como `tsyringe` ou a nativa do nestjs) ou prefere seguir com Injeção Manual construindo Factories Limpas ('Manual DI') para evitar bibliotecas a mais?
2. **Design de Entidades (Domain Driven Design Lite):** Você quer ir além e parar de repassar os Tipos Typescript auto-gerados do `Prisma` via UseCases e passar a usar Entidades / Classes de negócio próprias (ex: Classe WorkoutSession que contém comportamentos e não apenas C-structs)? (Aumenta o overhead, mas dá total controle).
3. **Escopo de Alteração:** Você gostaria de autorizar todo o Roadmap (Fases 1 a 4) de uma vez só ou ir de forma granular, escolhendo quais Use Cases refatorar e aprender primeiro?
