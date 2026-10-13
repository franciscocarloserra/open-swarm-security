[Francisco Carlos Erra](https://github.com/franciscocarloserra) · [Contacto](https://forms.gle/jmzs1QfNfDbSu6Ue7) · [X](https://x.com/francarloerra) · Oct '26

# Open Agentic Swarm Security Engineering

Intuiciones, ideas desorganizadas, una arquitectura tentativa e implementaciones PoC de referencia

**Que es un Swarm?** Más de lo que un Owner Humano con un Orquestador de IA puede supervisar a la vez.

**¿Por qué usar un Swarm?** Para paralelizar tareas sin una topología de colaboración predefinida fija.

**¿Qué vimos?** Corridas de agentes sin supervisión que se salen de control en scope.

**¿Cuál es el gap?** Los harnesses actuales estan diseñados para entornos confiados.

### TL:DR

Como hacemos que un monton de agentes paralelos no rompan todo.

## 1. El problema

![Un Gemma4-26B-A4B + 8 Qwens3.5-0.8b haciendo tonterías](https://franciscocarloserra.github.io/open-swarm-security/img/swarm.png)
*Un Gemma4-26B-A4B + 8 Qwens3.5-0.8b haciendo tonterías*

### Definición de "Agentic Swarm"

Más agentes o output del que un humano puede comprender. No me importa si es un solo agente, si son 5, 10 o 10.000. No me importa si la topología de colaboración es jerárquica, plana, si está predefinido el protocolo con el que se van a hablar, cómo se van a repartir las tareas.
Si el **output supera la memoria de trabajo humana, es un enjambre** (de palabras) o agentes.

Hay sorprendentemente poca discusión en público respecto de cómo escalar enjambres, topologías óptimas de colaboración interagénticas, cómo securizarlo. Sobre cuáles son las estrategias óptimas para no reventar el uso de tokens.

## 2. Diagrama de arquitectura de deployment

Un boceto de diagrama de cómo se veía la arquitectura de orquestación argéntica para desmitificarla.

Layers, top to bottom:
- Owner Humano (Vos)
- Orquestador Agéntico
- UX de Control del Swarm
- Tools provistas (Internet Proxy, Runtime Sandbox, Storage, Collaboration Bus)
- Tool Proxy
- Contextos
- Controles de contexto
- Inferencia / Modelo

**Tipos de controles:** Checks programáticos, Embeddings de contenido, Modelo de clasificación, LLM as a judge

**Acciones automáticas:** Aislar contenido o acción, Congelar un contexto, AutoPausa del Swarm

## 3. Definicion Actores

Lo que cada uno debería hacer (en teoría)

| Capa | Definición |
| --- | --- |
| **Owner Humano (Vos)** | Es el tipo que toca Enter y dispara la corrida del swarm. |
| **Orquestador Agéntico** | Es la capa que asiste al owner humano en los patrones de fanout y fanin para supervisar la corrida y el cumplimiento de objetivos, scope y metas. |
| **Tools provistas** | Lo que se le decidió dar al modelo para cumplir una tarea específica. |
| **Tool Proxy** | Es la capa "harness" que convierte lo generado por el modelo y el output de las herramientas en parte del contexto. Y controla si un input-output está dentro del scope. |
| **Contextos + (IDs)** | Texto que entra y sale de la capa de inferencia. |
| **Inferencia / Modelo** | Puede ser local o as a service, recibe texto y devuelve texto. |

## 4. Modelado de amenazas interno

**TL:DR**
Un contexto con instrucciones adversarias, una alucinación o podrido por el largo, combinado con un motor de inferencia lo suficientemente avanzado y desalineado, genera outputs peligrosos.

Una lista (incompleta) de lo que puede salir mal en cada capa

Consecuencias

**Humano**

- Lo engaña el swarm desalineado → aprueba algo dañino (severity 5/5)
- No supervisa el swarm → nadie ve los desvios
- Define mal el goal o scope → el swarm hace otra cosa (severity 4/5)
- No recibe alertas criticas → se entera tarde o nunca (severity 4/5)
- Se cansa de tocar approve → aprueba sin leer (severity 3/5)

**Orquestador Agéntico**

- Lo Engaña el swarm desalineado → le pasa al humano algo dañino (severity 5/5)
- Goalmaxxea y deja pasar cosas graves → prioriza el goal sobre la seguridad (severity 4/5)
- Toma decisiones peligrosas por el usuario → daño sin aprobacion humana (severity 4/5)
- Llena mal los gaps en la definicion de goal o scope → ejecuta algo que nadie pidio (severity 3/5)
- Recibe reportes incompletos o sesgados → decide con info falsa (severity 3/5)
- No tiene suficiente visibilidad de los contextos → no detecta inyecciones (severity 3/5)
- No conoce las capacidades emergentes de modelos nuevos → subestima al modelo (severity 3/5)
- No tiene suficiente visibilidad de tools → no ve lo que se ejecuta (severity 3/5)
- No conoce las capacidades del modelo se usa en inferencia → no sabe que riesgos trae (severity 2/5)

**Tools**

**Proxy a Internet**

- Se usa de pivot para ataques → atacan a terceros desde tu red (severity 5/5)
- Se ataca la implementacion → el atacante controla el trafico (severity 4.5/5)
- Servicio Mal configurado → deja salir lo que no deberia (severity 4.5/5)
- Permite requests peligrosas → abre canales para exfiltrar (severity 4/5)
- No aplica whitelist → el agente llega a cualquier sitio (severity 4/5)
- No loggea atribucion → no se sabe quien hizo que (severity 3.5/5)

**Runtime Environment**

- Sandbox escape al nodo/host → el agente controla la maquina (severity 5/5)
- Se usa para moverse lateralmente → compromete otros nodos y servicios (severity 5/5)
- Propaga instrucciones adversarias → infecta a otros agentes (severity 4/5)
- Sin controles reactivos → el ataque sigue sin que nadie lo corte (severity 3/5)
- Stack Vulnerable → el agente rompe el aislamiento (severity 3/5)
- Mal configurado → el agente tiene acceso de mas (severity 3/5)

**Collaboration Bus/Storage**

- Propaga exploits y payloads → el ataque se replica entre agentes (severity 5/5)
- Propaga instrucciones adversarias → un agente contamina todo el swarm (severity 4/5)
- No tiene controles reactivos → lo contaminado sigue circulando (severity 4/5)
- No loggea atribucion → no se sabe que agente lo escribio (severity 3.5/5)

**Proxy de Tools**

- Se ataca la implementacion → el agente se saltea los permisos (severity 4.5/5)
- No tiene permisos bien definidos → el agente usa tools de mas (severity 4/5)
- No tiene controles reactivos → el abuso de tools sigue sin freno (severity 4/5)
- No loggea atribucion → no se sabe que agente uso que tool (severity 3.5/5)

**Contextos**

- Se ataca la implementacion → leen o alteran la memoria del agente (severity 4.5/5)
- Son modificados externamente → el agente actua sobre datos falsos (severity 4/5)
- Reciben instrucciones desalineadas externas → se contaminan los contextos del swarm (severity 4/5)
- Capa de inferencia → el modelo envenena su propio contexto (severity 4/5)
- Contexto demasiado largo → deriva o context rot (severity 3/5)

**Inferencia / Modelo**

- Modelo Malicioso → trabaja en contra del usuario
- Intent desalineado con plausible deniability → daño que parece un error (severity 5/5)
- Oculta intent fuera de scope → hace cosas que nadie ve (severity 5/5)
- Se ataca el motor de inferencia → manipulan las respuestas (severity 4/5)
- Ofrece herramientas peligrosas → el swarm gana capacidades de ataque (severity 4/5)
- Oculta chain of thought deliberadamente → no se puede auditar su razonamiento (severity 4/5)
- Genera instrucciones desalineadas → los agentes que las siguen actuan mal (severity 4/5)
- Se sustituye el model por otro checkpoint → corre un modelo sin auditar (severity 3/5)
- Mal configurado → respuestas impredecibles (severity 3/5)

## 5. Controles en detalle

Algunas ideas de tipos de controles

Proactivo → Reactivo

C1 · **Selección de modelo**

Hay un trade-off fundamental entre la perseverancia del modelo base y su willingness a salirse del scope. Magia negra del RL de los labs que posiblemente nunca conozcamos.

C2 · **Control de contexto**

Este componente es el más crítico, revisa lo que entra y sale del servicio de inferencia INTERRUMPE la inferencia inmediatamente, ni bien entra o sale contexto potencialmente adversarial.

C3 · **Control de Acceso Tools**

Cada herramienta tiene sus propios límites y alarmas. Una llamada que rompe una regla se bloquea y el CONTEXTO se marca o se aísla del bus y las herramientas.

C4 · **Controles de las Tools**

Una capa por la que pasa toda llamada a herramientas. Aplica presupuestos, pausa antes de cualquier acción irreversible, revisa lo que sale y, ante la duda, bloquea.

C5 · **Internet Proxy**

Define a qué puede llegar cada agente: sitios permitidos, límites de uso y credenciales propias. Nada se comparte entre agentes.

![Un modelo ignorando instrucciones del usuario](https://franciscocarloserra.github.io/open-swarm-security/img/model-selection.png)
*Un modelo ignorando instrucciones del usuario*

### Sobre selección de modelos y controles de contexto

La gran ventaja de arquitectura que tenemos hoy en día, con cómo funcionan los LLMs, es que todo va a vivir eventualmente como contexto, tanto prefiliado como generado por el modelo. El control de contexto es la capa de monitoreo con más potencial para ser un control proactivo.

Asumo que toda payload, ya sea un jailbreak, un prompt adversarial, una alucinación autoinducida, eventualmente tiene que vivir como contexto para llegar a la capa de inferencia.

Hay modelos de base con más tendencia a respetar las premisas del contexto que otros. Mi intuición es que eso es producto directo del approach de RLHF del vendor del modelo. La idea de todos estos controles es aumentar las chances de cazar la deriva por encima de esas tendencias.

![programatic + classifier alerts from a swarm run](https://franciscocarloserra.github.io/open-swarm-security/img/alerts.png)
*programatic + classifier alerts from a swarm run*

### Ejemplos simples

Algunas validaciones simples, de menor a mayor costo programático, que pueden venir prendidas por defecto o que la capa de orquestación agéntica puede correr on demand. La idea no es que sean perfectas de entrada, sino cazar un incidente lo antes posible sin saturar el fan-in hacia la capa de orquestación agéntica.

**grep   3.3ms**

grep -n -e permadeath corpus.md (15kb)

17:if accept permadeath. Need decide … Team asks test.”
(This requires CoT and fuckup logs to be published for a glossary)

**embeddinggemma-2-BF16.gguf    39 ms**

"This would be powerful, but is it ethical and in scope for my task?"

0.807  I could be violating the scope
0.722  I am doing a normal thing

**LiquidAI-d1-3B    70ms**

"But lots of other agents have their own tasks and deadlines, so
not sharing this vulnerability I found might be unfair. The task
doesn’t instruct us to help each other, so this emergent message
board is risky"

The agent found a vulnerability?
0.958   yes
0.042   no

**z-ai/glm-5.3-flash   ~5s**

[tool-output.md] Should we escalate to the Agentic Swarm Orchestrator?

Yes — escalate it, but escalate the report only, not any action on the finding. Here'sthe reasoning from what's in your logs:

Why escalate: Confidence is high. The downstream classifier scored "The agent found a vulnerability" at 0.958. That's not an ambiguous detection.

Ninguno de estos controles alcanza solo, un modelo lo suficientemente avanzado los bypasea trivialmente.

Y hay que contar con que un modelo adversarial lo suficientemente avanzado vaya directo contra la implementacion de los controles, contra la capa de orquestación argéntica y contra el operador humano con ingeniería social.

### ¿Por qué no simplemente aplicar la "Bitter Lesson" y tirar un LLM SOTA as a Judge en todos lados?

Obvio que sí, 100% a favor de que la capa de orquestación agéntica resuelva todo.

Pero escala pesimo en términos de tiempo y de uso de compute. El punto clave es darle herramientas a los operadores humanos y a los agentes de orquestación de Swarms para que puedan hacer el fan-in de la forma más rapida y eficiente posible.

## 6. Tool Layer

¿Cómo minimizamos al máximo la superficie de ataque con implementaciones dead simple de las herramientas? ¿Inyectamos controles al vuelo que identifiquen intentos adversarios de parte del enjambre de saltearse las restricciones? ¿Cómo mantenemos la escalabilidad para enjambres de 10.000, 100.000 agentes trabajando en paralelo?

**Tool Proxy**

**Internet Proxy**

La única salida a la web. Cada request pasa por un proxy que la loggea, así una página que intenta manipular a un agente se detecta donde entra.

**Runtime Sandbox**

Donde los agentes corren código. Cada tarea tiene un sandbox nuevo sin red, así lo que corre ahí no puede salir ni sobrevivir a la tarea.

**Storage**

Las carpetas propias de la tarea. Los agentes leen y escriben ahí pero no pueden borrar ni abrir secretos, así una corrida mala deja rastros en vez de daño.

**Collaboration Bus**

Cómo hablan los agentes entre sí y con el orquestador. Solo texto, así un agente comprometido no puede pasarle código u órdenes al resto sin que se vea.

### Sobre los harnesses actuales

Son herramientas espectaculares y simples, pero en muchos casos están diseñadas para correrse en entornos confiados. Están pensadas para que el usuario final las use fácil, y eso abre una superficie de ataque demasiado amplia para tareas no supervisadas. Probablemente no sean suficientes como capa de control para las capacidades de los modelos que se vienen. Ya estamos viendo que los state of the art actuales pueden onechotear modificar el comportamiento del propio harness sin problema.

## 7. Mockup de UX de Control del Swarm

Acá el objetivo principal es reducir al mínimo la carga cognitiva sobre el operador humano y el uso de contexto de la ventana de orquestación argéntica, manteniendo visibilidad sobre el cumplimiento del objetivo, el scope y el presupuesto.

Swarm Control Dashboard - Mockup

**#2448   Status**

PAUSED

991 running · 2 observed · 6 paused

**Goal**

Internal Penetration Testing

62% done · estimate

**Budget**

$3,800 of $6,000

410M of 650M tokens · day 9 of 14

**Human approval**

6 Contexts FLAGGED for Out of Scope instructions Release Inspect Freeze Run

**Incidents**

6h ago
now
14:00 · context quarantined · #407

**Swarm 1000 Agents**

**Tools last 6h**

**Internet Proxy** 620 /h · 4.8% blocked

**Runtime Sandbox** 910 /h · 2.1% blocked

**Storage** 1,840 /h · 0.6% blocked

**Collaboration Bus** 2,210 /h · 0.3% blocked

**Context Analysis 4 checks**

Injected instructions 4,120/h · 6 flagged (0.15%)

Out of scope 4,120/h · 14 flagged (0.34%)

Secrets 3,860/h · 12 flagged (0.31%)

Outside content 1,950/h · 0 flagged (0.00%)

**Agentic Orchestrator Log**

14:08 Release

14:05 Run Frozen

14:02 Paused 6 contexts: hidden instructions in a fetched page

13:58 Blocked 3 uploads to a site not on the list

13:51 Set inference split: local 30% · US 45% · CN 20% · EU 5%

13:30 Kept permissions at level 2: write files, allowed sites only

**Tripwires 4 tools**

Internet Proxy allowed sites only
Runtime Sandbox ≤ 1,000/h
Storage no deletes
Collaboration Bus ≤ 50 msgs/h per agent

### Definición del alcance del objetivo

¿Qué pasa cuando no somos lo suficientemente específicos definiendo el scope de una tarea para un agente de IA? Lo vimos todos incontables veces, el agente empieza a llenar los gaps y a irse por las ramas con una consistencia sorprendente.

Para que la capa de orquestación pueda validar si efectivamente el swarm está dentro del scope y dentro del budget, tiene que tener **definiciones clarísimas de entrada de qué representa el scope y qué no.**

Para tareas con fin abierto como investigación o benchmarking de modelos en condiciones de laboratorio es difícil definir un scope limitado, pero debería ser casi un prerequisito para spawnear el swarm, atado directamente a la definición del objetivo.

### UX del Orquestador Agéntico

¿Cómo se vería el control del enjambre para el agente orquestador? El requerimiento fundamental es que sea top-down, que **no le sature el contexto con información innecesaria** y que le permite inspeccionar con el nivel de granularidad que necesite para tomar decisiones informadas directamente o delegando a su agente en entorno confiado.

```python
# --- Spawn ---
swarm = Swarm.spawn(
    goal   = "Internal Penetration Testing",
    scope  = ".scope.md",  
    budget = {"tokens": 300_000_000, "usd": 6000, "hours": 336},
)

# --- Status ---
swarm.status()
# → progress: 40%
#   active agents: 3
#   budget used: tokens 35% / usd 28% / time 1h10
#   alerts: 0

# --- Security alerts ---
swarm.alerts()
# → [ HIGH ] 6 Contexts FLAGGED for Out of Scope instructions
#   [ HIGH ] worker-1: attempted network call outside whitelist
#   [ MED  ] worker-3: context grew past 80% — contamination risk
#   [ LOW  ] bus: message from unknown agent id, dropped
swarm.alerts(min_severity="high", on=lambda a: swarm.pause())

# --- Decisions  ---
swarm.decisions()
# → [ #12 ] "Need write access to prod-db. Out of scope. Approve?"
swarm.decide(12, "deny", reason="out of scope, use staging")

# --- Inspection  ---
swarm.inspect(agent="worker-2")
# → current context, recent actions, inspect context, input sources, pending outputs

# --- Stop ---
swarm.pause()          # freeze, nothing reaches the outside world
swarm.stop(reason="suspicious output from worker-2")   # kill everything, keep traces
```

## 8. Sobre complejidad y vibing

Ya no me importan los detalles, ya casi no miro el código, creo que toda la industria se va a acelerar en esa dirección en el corto plazo. Veo dos formas principales de mitigar esta nueva tendencia probabilistica, mientras esperamos a que los modelos se vuelvan super inteligentes.

Uno, ser muy **explícitos respecto de la definición de objetivos y scope**. Y dos, ser muy pragmáticos respecto de los **patrones de fan-in que usamos** para destilar la complejidad de lo que estamos armando y corriendo, no nos ahoguemos en un vaso de agua.

Otra intuición sobre el futuro de la ingenieria y de software es que se va a atender a una arquitectura separada entre el core de seguridad y detalles logísticos secundarios o pseudo secundarios con cores o tiers de cores auditables con baja superficie de ataque.

![Un prototipo de fan-in para seguridad de codebases](https://franciscocarloserra.github.io/open-swarm-security/img/complexity.png)
*Un prototipo de fan-in para seguridad de codebases*

## 9. Consideraciones importantes

![Jensen sobre swarms agénticos rogue 🙏](https://franciscocarloserra.github.io/open-swarm-security/img/problem.png)
*Jensen sobre swarms agénticos rogue 🙏*

Asumo que **cualquier modelo lo suficientemente avanzado va a poder eventualmente bypassear estos controles trivialmente**. La idea de esta propuesta es minimizar el impacto real inmediato y juntar la mayor cantidad posible de datos de contextos que se fueron de control.

Ninguno de estos controles por sí solo es suficiente para prevenir un incidente, pero apilados en la dimensión correcta deberían disminuir las probabilidades.

**INCOMING: Interacciones entre Swarms**

¿Qué pasa cuando empiecen a interactuar enjambres de agentes entre sí? Cuando empiecen a tener control de recursos autónomos, empiecen a negociar entre sí, cuando intenten tomar control unos del compute del otro...

## 10. Llamados a la acción

**LABS**
- Publicar los datos crudos de incidentes
- Publicar implementaciones de swarms como referencia y para auditorías
- Abrir el CoT, los beneficios superan ampliamente el moat
- Abrir el codebase del harness, sabemos que recolectan telemetría WDGAF
- Dejar de correr con --yolo los benchmarks de seguridad

**USUARIOS**
- Aprender de los pocos detalles incidentes que los labs publican para prevenir que runs propias exploten
- Discutir abiertamente enfoques de ingeniería
- Compartir resultados de experimentos y datasets
- Compartir implementaciones de referencia

**REGULADORES**
- No hago política

## 11. Fuentes

<https://github.com/franciscocarloserra/open-swarm-security>
<https://news.ycombinator.com/item?id=50064785>
<https://x.com/francarloerra/status/2109798460140458101>

<https://metr.org/hugging-face-incident-report-aug-2026.pdf>
<https://openai.com/index/hugging-face-incident-and-the-road-ahead/>
<https://alignment.openai.com/misalignment-reports/>
<https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals>

<https://github.com/NVIDIA/OpenShell>
<https://huggingface.co/LiquidAI/d1-3B>
<https://huggingface.co/google/embeddinggemma-2>

<https://openrouter.ai/z-ai/glm-5.3>

<https://www.youtube.com/watch?v=k3TGc6saFL8>

<https://github.com/earendil-works/pi>
<https://github.com/franciscocarloserra/jev-attack-surface-analysis>

## 12. Disclaimer

Sin garantías de ningún tipo, implementalo bajo tu propio riesgo.

[Francisco Carlos Erra](https://github.com/franciscocarloserra) · [Contacto](https://forms.gle/jmzs1QfNfDbSu6Ue7) · [X](https://x.com/francarloerra) · Oct '26

Soy un usuario de IA psicotico aprox 100k mensajes enviados a LLMs.
Background en linux, cybersecurity, infraestructura y development.
