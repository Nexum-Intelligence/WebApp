import React, { createContext, useContext, useEffect, useState } from "react";

export const LANGS = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const dict = {
  en: {
    nav: { about: "About Us", whatWeBuild: "What We Build", howItWorks: "How it Works", blog: "Blog", contact: "Contact Us" },
    btn: { platform: "PLATFORM", contact: "CONTACT US", bookCall: "BOOK A STRATEGY CALL", explorePlatform: "Explore the Autonomous Agent Platform", getToKnowAgents: "Get to know our AI agents", startQuestionnaire: "Start the questionnaire", runScore: "Run Potential Score", signIn: "Sign in" },
    hero: { l1: "Build Intelligent", l2: "Business Systems. Not", l3: "Just Software.", statement: "NEXUM Intelligence brings a new era of AI into your business: autonomous agent systems that diagnose challenges, design strategic solutions, and execute them end-to-end. Our agents do not stop at insights - they build models, create assets, run workflows, and continuously optimize your operations for measurable growth." },
    impact: { title1: "Real Systems.", title2: "Real Transformation.", sub1: "We do not experiment with AI.", sub2: "We engineer intelligent business systems that deliver measurable impact from day one.", stats: ["40% Average Workflow Automation", "3x Faster Operational Output", "24/7 AI Execution & Overhead", "Enterprise-Level Security & Scalability"] },
    build: { label: "Why NEXUM Intelligence", title: "What We Build", intro: "NEXUM Intelligence builds AI systems that autonomously think, orchestrate, and execute end-to-end.", services: [
      { title: "Autonomous AI Agent Systems", text: "Autonomous agents that diagnose, orchestrate, and execute your business operations end-to-end, and not just automate tasks." },
      { title: "Intelligent Business Intelligence", text: "Deep diagnostic models and strategic AI frameworks that understands your business architecture, identifies bottlenecks, and drives strategic decisions automatically." },
      { title: "Autonomous Sales & Growth Engines", text: "Self-optimizing AI systems that find opportunities, qualify leads, and convert revenue – continuously, predictably, and without human intervention." },
      { title: "Unified AI Operating Dashboards", text: "A real-time intelligence layer that connects all agents, aligns workflows, and keeps your entire business running as one coordinated system." },
    ] },
    works: { pill: "WORK", title: "How NEXUM Intelligence Works", phases: [
      { num: "01", title: "Analyse", text: "Real-time intelligence that reveals opportunities, risks and strategic direction." },
      { num: "02", title: "Create", text: "Architecting business models, strategies and brand foundations that stand out." },
      { num: "03", title: "Operate", text: "Running your company with automated insights, connected data and operational clarity." },
      { num: "04", title: "Optimize", text: "Forecasting, prioritizing and recommending actions that maximize performance." },
      { num: "05", title: "Execute", text: "Turning strategy into action through intelligent automation and seamless implementation." },
    ], steps: [
      { num: "01", title: "Information Input", text: "Lets the Agents know all informations about your business and idea." },
      { num: "02", title: "Choose your Module", text: "Pick the agent modules that match your current goal." },
      { num: "03", title: "Give your Agents a Task and watch them work", text: "Assign a task and watch the autonomous agents execute it end-to-end." },
      { num: "04", title: "Validate the Outcome", text: "Give the agents feedback until you are happy with the results." },
      { num: "05", title: "Contact us for your individual Setup", text: "We build your tailored agent setup around your business." },
    ] },
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { q: "What is NEXUM Intelligence?", a: "NEXUM Intelligence is a modern technology solutions platform focused on secure digital systems, streamlined workflows, and business growth through smart innovation." },
      { q: "Is NEXUM Intelligence cloud-based or self-hosted?", a: "Systems can be designed around cloud, self-hosted, or hybrid needs depending on your stack and compliance requirements." },
      { q: "How secure is NEXUM Intelligence really?", a: "Security is handled through scoped access, secure data layers, audit-ready workflows, and architecture choices matched to your risk profile." },
      { q: "Can I manage everything from one dashboard?", a: "Yes. The core idea is centralized AI workflow control, performance monitoring, and prompt/model management." },
      { q: "How does pricing work?", a: "Pricing depends on scope, integrations, support level, and whether you need a prototype, launch system, or ongoing managed infrastructure." },
    ],
    cta: { title: "Ready to Build Your AI Advantage?" },
    security: {
      pill: "Security & Compliance",
      title: "Built in Germany. Secure by Design.",
      intro: "Your data stays protected. NEXUM Intelligence is headquartered in Germany, hosts within the EU, and engineers every system to meet strict European data-protection and information-security standards.",
      items: [
        { name: "GDPR · DSGVO", desc: "Compliant with the EU General Data Protection Regulation." },
        { name: "BDSG", desc: "Aligned with the German Federal Data Protection Act." },
        { name: "ISO/IEC 27001", desc: "Information security management best practices." },
        { name: "ISO/IEC 27701", desc: "Privacy information management extension." },
        { name: "SOC 2 Type II", desc: "Security, availability and confidentiality controls." },
        { name: "EU AI Act", desc: "Responsible, transparent and compliant AI systems." },
        { name: "BSI IT-Grundschutz", desc: "German federal baseline for IT security." },
        { name: "EU Data Residency", desc: "Hosted in German / EU data centers, encrypted with AES-256 & TLS." },
      ],
    },
    footer: { tagline: "Stop managing tasks. Start managing systems.", links: ["Trust & Impact", "What We Build", "How NEXUM Works", "Use Case Demo", "Why NEXUM", "Testimonials"] },
    platform: { pill: "Agent Platform", title: "Access Your Autonomous Agent Platform", signinText: "Sign in to save your potential analysis, compare business ideas and unlock NEXUM Intelligence recommendations for your next growth move.", google: "Sign in with Google", microsoft: "Sign in with Microsoft", email: "Email", password: "Password", scorePill: "POTENTIAL ANALYSIS", scoreTitle: "Increase and scale your success with NEXUM Intelligence.", scoreIntro: "Describe your business idea and let the platform score how strongly it can benefit from autonomous agents, automation and intelligent operations.", agentBubble: "Hi, I'm your analysis agent. Answer a few quick questions and I'll score how much your idea can benefit from autonomous agents.", businessIdea: "Business Idea", businessIdeaPlaceholder: "Describe the idea, target audience, current process and expected outcome.", fields: { "Business Stage": "Business Stage", "Main Objective": "Main Objective", "Industry Focus": "Industry Focus", "Automation Maturity": "Automation Maturity" } },
  },

  de: {
    nav: { about: "Über uns", whatWeBuild: "Was wir bauen", howItWorks: "So funktioniert's", blog: "Blog", contact: "Kontakt" },
    btn: { platform: "PLATTFORM", contact: "KONTAKT", bookCall: "STRATEGIEGESPRÄCH BUCHEN", explorePlatform: "Autonome Agenten-Plattform entdecken", getToKnowAgents: "Lerne unsere KI-Agenten kennen", startQuestionnaire: "Fragebogen starten", runScore: "Potenzial berechnen", signIn: "Anmelden" },
    hero: { l1: "Baue intelligente", l2: "Business-Systeme. Nicht", l3: "nur Software.", statement: "NEXUM Intelligence bringt eine neue KI-Ära in dein Unternehmen: autonome Agentensysteme, die Herausforderungen diagnostizieren, strategische Lösungen entwerfen und sie Ende-zu-Ende umsetzen. Unsere Agenten hören nicht bei Erkenntnissen auf - sie bauen Modelle, erstellen Assets, steuern Workflows und optimieren deinen Betrieb kontinuierlich für messbares Wachstum." },
    impact: { title1: "Echte Systeme.", title2: "Echte Transformation.", sub1: "Wir experimentieren nicht mit KI.", sub2: "Wir entwickeln intelligente Business-Systeme, die vom ersten Tag an messbaren Nutzen liefern.", stats: ["40% durchschnittliche Workflow-Automatisierung", "3x schnellere operative Leistung", "24/7 KI-Ausführung & Overhead", "Sicherheit & Skalierbarkeit auf Enterprise-Niveau"] },
    build: { label: "Warum NEXUM Intelligence", title: "Was wir bauen", intro: "NEXUM Intelligence baut KI-Systeme, die autonom denken, orchestrieren und Ende-zu-Ende ausführen.", services: [
      { title: "Autonome KI-Agentensysteme", text: "Autonome Agenten, die deine Geschäftsabläufe Ende-zu-Ende diagnostizieren, orchestrieren und ausführen - nicht nur Aufgaben automatisieren." },
      { title: "Intelligente Business Intelligence", text: "Tiefgehende Diagnosemodelle und strategische KI-Frameworks, die deine Unternehmensarchitektur verstehen, Engpässe erkennen und strategische Entscheidungen automatisch vorantreiben." },
      { title: "Autonome Vertriebs- & Wachstumsmaschinen", text: "Selbstoptimierende KI-Systeme, die Chancen finden, Leads qualifizieren und Umsatz erzeugen - kontinuierlich, planbar und ohne menschliches Zutun." },
      { title: "Vereinheitlichte KI-Betriebs-Dashboards", text: "Eine Echtzeit-Intelligenzschicht, die alle Agenten verbindet, Workflows abstimmt und dein gesamtes Unternehmen als ein koordiniertes System am Laufen hält." },
    ] },
    works: { pill: "ABLAUF", title: "So arbeitet NEXUM Intelligence", phases: [
      { num: "01", title: "Analyse", text: "Echtzeit-Erkenntnisse, die Chancen, Risiken und die strategische Richtung sichtbar machen." },
      { num: "02", title: "Erstellen", text: "Aufbau von Geschäftsmodellen, Strategien und Markenfundamenten, die herausstechen." },
      { num: "03", title: "Betreiben", text: "Führe dein Unternehmen mit automatisierten Insights, vernetzten Daten und operativer Klarheit." },
      { num: "04", title: "Optimieren", text: "Prognostizieren, priorisieren und Maßnahmen empfehlen, die die Leistung maximieren." },
      { num: "05", title: "Umsetzen", text: "Strategie in Handeln verwandeln – durch intelligente Automatisierung und nahtlose Umsetzung." },
    ], steps: [
      { num: "01", title: "Informationseingabe", text: "Gib den Agenten alle Informationen über dein Unternehmen und deine Idee." },
      { num: "02", title: "Wähle dein Modul", text: "Wähle die Agenten-Module, die zu deinem aktuellen Ziel passen." },
      { num: "03", title: "Gib deinen Agenten eine Aufgabe und sieh ihnen bei der Arbeit zu", text: "Vergib eine Aufgabe und beobachte, wie die autonomen Agenten sie Ende-zu-Ende ausführen." },
      { num: "04", title: "Prüfe das Ergebnis", text: "Gib den Agenten Feedback, bis du mit dem Ergebnis zufrieden bist." },
      { num: "05", title: "Kontaktiere uns für dein individuelles Setup", text: "Wir bauen dein maßgeschneidertes Agenten-Setup rund um dein Unternehmen." },
    ] },
    faqTitle: "Häufig gestellte Fragen",
    faqs: [
      { q: "Was ist NEXUM Intelligence?", a: "NEXUM Intelligence ist eine moderne Technologie-Plattform mit Fokus auf sichere digitale Systeme, schlanke Workflows und Unternehmenswachstum durch smarte Innovation." },
      { q: "Ist NEXUM Intelligence cloudbasiert oder selbstgehostet?", a: "Systeme können je nach Stack und Compliance-Anforderungen für Cloud, Self-Hosting oder hybride Szenarien ausgelegt werden." },
      { q: "Wie sicher ist NEXUM Intelligence wirklich?", a: "Sicherheit wird über zugriffsbeschränkte Rollen, sichere Datenschichten, audit-fähige Workflows und auf dein Risikoprofil abgestimmte Architektur gewährleistet." },
      { q: "Kann ich alles über ein Dashboard steuern?", a: "Ja. Die Kernidee ist zentrale Steuerung von KI-Workflows, Performance-Monitoring und Prompt-/Modell-Management." },
      { q: "Wie funktioniert die Preisgestaltung?", a: "Der Preis hängt von Umfang, Integrationen, Support-Level und davon ab, ob du einen Prototyp, ein Launch-System oder laufend gemanagte Infrastruktur benötigst." },
    ],
    cta: { title: "Bereit, deinen KI-Vorsprung aufzubauen?" },
    security: {
      pill: "Sicherheit & Compliance",
      title: "In Deutschland gebaut. Sicher by Design.",
      intro: "Deine Daten bleiben geschützt. NEXUM Intelligence hat seinen Sitz in Deutschland, hostet innerhalb der EU und entwickelt jedes System nach strengen europäischen Datenschutz- und IT-Sicherheitsstandards.",
      items: [
        { name: "DSGVO · GDPR", desc: "Konform mit der EU-Datenschutz-Grundverordnung." },
        { name: "BDSG", desc: "Ausgerichtet am Bundesdatenschutzgesetz." },
        { name: "ISO/IEC 27001", desc: "Best Practices für Informationssicherheits-Management." },
        { name: "ISO/IEC 27701", desc: "Erweiterung für Datenschutz-Management." },
        { name: "SOC 2 Type II", desc: "Kontrollen für Sicherheit, Verfügbarkeit und Vertraulichkeit." },
        { name: "EU AI Act", desc: "Verantwortungsvolle, transparente und konforme KI-Systeme." },
        { name: "BSI IT-Grundschutz", desc: "Deutscher Standard für IT-Sicherheit." },
        { name: "EU-Datenhaltung", desc: "Hosting in deutschen / EU-Rechenzentren, verschlüsselt mit AES-256 & TLS." },
      ],
    },
    footer: { tagline: "Hör auf, Aufgaben zu managen. Fang an, Systeme zu managen.", links: ["Vertrauen & Wirkung", "Was wir bauen", "So arbeitet NEXUM", "Use-Case-Demo", "Warum NEXUM", "Referenzen"] },
    platform: { pill: "Agenten-Plattform", title: "Zugang zu deiner autonomen Agenten-Plattform", signinText: "Melde dich an, um deine Potenzialanalyse zu speichern, Geschäftsideen zu vergleichen und NEXUM-Intelligence-Empfehlungen für deinen nächsten Wachstumsschritt freizuschalten.", google: "Mit Google anmelden", microsoft: "Mit Microsoft anmelden", email: "E-Mail", password: "Passwort", scorePill: "POTENZIALANALYSE", scoreTitle: "Steigere und skaliere deinen Erfolg mit NEXUM Intelligence.", scoreIntro: "Beschreibe deine Geschäftsidee und lass die Plattform bewerten, wie stark sie von autonomen Agenten, Automatisierung und intelligenten Abläufen profitieren kann.", agentBubble: "Hi, ich bin dein Analyse-Agent. Beantworte ein paar kurze Fragen und ich bewerte, wie stark deine Idee von autonomen Agenten profitieren kann.", businessIdea: "Geschäftsidee", businessIdeaPlaceholder: "Beschreibe die Idee, Zielgruppe, den aktuellen Prozess und das erwartete Ergebnis.", fields: { "Business Stage": "Unternehmensphase", "Main Objective": "Hauptziel", "Industry Focus": "Branchenfokus", "Automation Maturity": "Automatisierungsgrad" } },
  },

  es: {
    nav: { about: "Nosotros", whatWeBuild: "Qué construimos", howItWorks: "Cómo funciona", blog: "Blog", contact: "Contacto" },
    btn: { platform: "PLATAFORMA", contact: "CONTACTO", bookCall: "AGENDAR UNA LLAMADA", explorePlatform: "Explora la plataforma de agentes autónomos", getToKnowAgents: "Conoce nuestros agentes de IA", startQuestionnaire: "Empezar el cuestionario", runScore: "Calcular potencial", signIn: "Iniciar sesión" },
    hero: { l1: "Construye sistemas", l2: "de negocio inteligentes. No", l3: "solo software.", statement: "NEXUM Intelligence trae una nueva era de IA a tu empresa: sistemas de agentes autónomos que diagnostican desafíos, diseñan soluciones estratégicas y las ejecutan de principio a fin. Nuestros agentes no se detienen en los insights: construyen modelos, crean activos, ejecutan flujos de trabajo y optimizan tus operaciones de forma continua para un crecimiento medible." },
    impact: { title1: "Sistemas reales.", title2: "Transformación real.", sub1: "No experimentamos con la IA.", sub2: "Diseñamos sistemas de negocio inteligentes que generan un impacto medible desde el primer día.", stats: ["40% de automatización media de flujos", "3x más rápida la producción operativa", "Ejecución de IA 24/7 y overhead", "Seguridad y escalabilidad de nivel empresarial"] },
    build: { label: "Por qué NEXUM Intelligence", title: "Qué construimos", intro: "NEXUM Intelligence construye sistemas de IA que piensan, orquestan y ejecutan de forma autónoma y de principio a fin.", services: [
      { title: "Sistemas de agentes de IA autónomos", text: "Agentes autónomos que diagnostican, orquestan y ejecutan tus operaciones de negocio de principio a fin, no solo automatizan tareas." },
      { title: "Business Intelligence inteligente", text: "Modelos de diagnóstico profundos y marcos de IA estratégicos que comprenden la arquitectura de tu negocio, identifican cuellos de botella y toman decisiones estratégicas automáticamente." },
      { title: "Motores autónomos de ventas y crecimiento", text: "Sistemas de IA autooptimizados que encuentran oportunidades, califican leads y generan ingresos de forma continua, predecible y sin intervención humana." },
      { title: "Paneles operativos de IA unificados", text: "Una capa de inteligencia en tiempo real que conecta a todos los agentes, alinea los flujos de trabajo y mantiene todo tu negocio funcionando como un solo sistema coordinado." },
    ] },
    works: { pill: "PROCESO", title: "Cómo funciona NEXUM Intelligence", phases: [
      { num: "01", title: "Analizar", text: "Inteligencia en tiempo real que revela oportunidades, riesgos y dirección estratégica." },
      { num: "02", title: "Crear", text: "Diseño de modelos de negocio, estrategias y bases de marca que destacan." },
      { num: "03", title: "Operar", text: "Dirige tu empresa con insights automatizados, datos conectados y claridad operativa." },
      { num: "04", title: "Optimizar", text: "Prever, priorizar y recomendar acciones que maximizan el rendimiento." },
      { num: "05", title: "Ejecutar", text: "Convierte la estrategia en acción mediante automatización inteligente e implementación fluida." },
    ], steps: [
      { num: "01", title: "Entrada de información", text: "Dale a los agentes toda la información sobre tu negocio y tu idea." },
      { num: "02", title: "Elige tu módulo", text: "Elige los módulos de agentes que se ajustan a tu objetivo actual." },
      { num: "03", title: "Dale una tarea a tus agentes y míralos trabajar", text: "Asigna una tarea y observa cómo los agentes autónomos la ejecutan de principio a fin." },
      { num: "04", title: "Valida el resultado", text: "Da feedback a los agentes hasta que estés satisfecho con el resultado." },
      { num: "05", title: "Contáctanos para tu configuración individual", text: "Creamos tu configuración de agentes a medida en torno a tu negocio." },
    ] },
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { q: "¿Qué es NEXUM Intelligence?", a: "NEXUM Intelligence es una plataforma moderna de soluciones tecnológicas centrada en sistemas digitales seguros, flujos de trabajo ágiles y el crecimiento del negocio a través de la innovación inteligente." },
      { q: "¿NEXUM Intelligence es en la nube o autoalojado?", a: "Los sistemas pueden diseñarse para la nube, autoalojamiento o necesidades híbridas según tu stack y tus requisitos de cumplimiento." },
      { q: "¿Qué tan seguro es realmente NEXUM Intelligence?", a: "La seguridad se gestiona mediante accesos delimitados, capas de datos seguras, flujos auditables y decisiones de arquitectura adaptadas a tu perfil de riesgo." },
      { q: "¿Puedo gestionar todo desde un panel?", a: "Sí. La idea central es el control centralizado de flujos de IA, la monitorización del rendimiento y la gestión de prompts/modelos." },
      { q: "¿Cómo funciona el precio?", a: "El precio depende del alcance, las integraciones, el nivel de soporte y de si necesitas un prototipo, un sistema de lanzamiento o infraestructura gestionada de forma continua." },
    ],
    cta: { title: "¿Listo para construir tu ventaja con IA?" },
    security: {
      pill: "Seguridad y Cumplimiento",
      title: "Creado en Alemania. Seguro por diseño.",
      intro: "Tus datos permanecen protegidos. NEXUM Intelligence tiene su sede en Alemania, aloja dentro de la UE y diseña cada sistema conforme a estrictos estándares europeos de protección de datos y seguridad de la información.",
      items: [
        { name: "RGPD · GDPR", desc: "Conforme con el Reglamento General de Protección de Datos de la UE." },
        { name: "BDSG", desc: "Alineado con la Ley Federal de Protección de Datos de Alemania." },
        { name: "ISO/IEC 27001", desc: "Buenas prácticas de gestión de seguridad de la información." },
        { name: "ISO/IEC 27701", desc: "Extensión para la gestión de la privacidad." },
        { name: "SOC 2 Type II", desc: "Controles de seguridad, disponibilidad y confidencialidad." },
        { name: "EU AI Act", desc: "Sistemas de IA responsables, transparentes y conformes." },
        { name: "BSI IT-Grundschutz", desc: "Base alemana para la seguridad informática." },
        { name: "Alojamiento en la UE", desc: "Alojado en centros de datos alemanes / UE, cifrado con AES-256 y TLS." },
      ],
    },
    footer: { tagline: "Deja de gestionar tareas. Empieza a gestionar sistemas.", links: ["Confianza e impacto", "Qué construimos", "Cómo funciona NEXUM", "Demo de caso de uso", "Por qué NEXUM", "Testimonios"] },
    platform: { pill: "Plataforma de agentes", title: "Accede a tu plataforma de agentes autónomos", signinText: "Inicia sesión para guardar tu análisis de potencial, comparar ideas de negocio y desbloquear recomendaciones de NEXUM Intelligence para tu próximo paso de crecimiento.", google: "Iniciar sesión con Google", microsoft: "Iniciar sesión con Microsoft", email: "Correo electrónico", password: "Contraseña", scorePill: "ANÁLISIS DE POTENCIAL", scoreTitle: "Aumenta y escala tu éxito con NEXUM Intelligence.", scoreIntro: "Describe tu idea de negocio y deja que la plataforma evalúe cuánto puede beneficiarse de agentes autónomos, automatización y operaciones inteligentes.", agentBubble: "Hola, soy tu agente de análisis. Responde unas preguntas rápidas y evaluaré cuánto puede beneficiarse tu idea de los agentes autónomos.", businessIdea: "Idea de negocio", businessIdeaPlaceholder: "Describe la idea, el público objetivo, el proceso actual y el resultado esperado.", fields: { "Business Stage": "Etapa del negocio", "Main Objective": "Objetivo principal", "Industry Focus": "Sector", "Automation Maturity": "Madurez de automatización" } },
  },

  fr: {
    nav: { about: "À propos", whatWeBuild: "Ce que nous construisons", howItWorks: "Comment ça marche", blog: "Blog", contact: "Contact" },
    btn: { platform: "PLATEFORME", contact: "CONTACT", bookCall: "RÉSERVER UN APPEL STRATÉGIQUE", explorePlatform: "Découvrir la plateforme d'agents autonomes", getToKnowAgents: "Découvrez nos agents IA", startQuestionnaire: "Démarrer le questionnaire", runScore: "Calculer le potentiel", signIn: "Se connecter" },
    hero: { l1: "Construisez des systèmes", l2: "d'entreprise intelligents. Pas", l3: "juste un logiciel.", statement: "NEXUM Intelligence apporte une nouvelle ère de l'IA à votre entreprise : des systèmes d'agents autonomes qui diagnostiquent les défis, conçoivent des solutions stratégiques et les exécutent de bout en bout. Nos agents ne s'arrêtent pas aux analyses - ils construisent des modèles, créent des ressources, pilotent des workflows et optimisent en continu vos opérations pour une croissance mesurable." },
    impact: { title1: "De vrais systèmes.", title2: "Une vraie transformation.", sub1: "Nous n'expérimentons pas avec l'IA.", sub2: "Nous concevons des systèmes d'entreprise intelligents qui produisent un impact mesurable dès le premier jour.", stats: ["40% d'automatisation moyenne des workflows", "3x plus de production opérationnelle", "Exécution IA 24/7 et overhead", "Sécurité et évolutivité de niveau entreprise"] },
    build: { label: "Pourquoi NEXUM Intelligence", title: "Ce que nous construisons", intro: "NEXUM Intelligence construit des systèmes d'IA qui pensent, orchestrent et exécutent de manière autonome, de bout en bout.", services: [
      { title: "Systèmes d'agents IA autonomes", text: "Des agents autonomes qui diagnostiquent, orchestrent et exécutent vos opérations de bout en bout, et pas seulement automatiser des tâches." },
      { title: "Business Intelligence intelligente", text: "Des modèles de diagnostic approfondis et des cadres d'IA stratégiques qui comprennent l'architecture de votre entreprise, identifient les goulots d'étranglement et pilotent les décisions stratégiques automatiquement." },
      { title: "Moteurs autonomes de vente et de croissance", text: "Des systèmes d'IA auto-optimisants qui trouvent des opportunités, qualifient les leads et génèrent du chiffre d'affaires, en continu, de façon prévisible et sans intervention humaine." },
      { title: "Tableaux de bord IA unifiés", text: "Une couche d'intelligence en temps réel qui relie tous les agents, aligne les workflows et fait fonctionner toute votre entreprise comme un seul système coordonné." },
    ] },
    works: { pill: "PROCESSUS", title: "Comment fonctionne NEXUM Intelligence", phases: [
      { num: "01", title: "Analyser", text: "Une intelligence en temps réel qui révèle opportunités, risques et direction stratégique." },
      { num: "02", title: "Créer", text: "Conception de modèles économiques, de stratégies et de fondations de marque qui se démarquent." },
      { num: "03", title: "Exploiter", text: "Pilotez votre entreprise avec des insights automatisés, des données connectées et une clarté opérationnelle." },
      { num: "04", title: "Optimiser", text: "Prévoir, prioriser et recommander les actions qui maximisent la performance." },
      { num: "05", title: "Exécuter", text: "Transformez la stratégie en action grâce à une automatisation intelligente et une mise en œuvre fluide." },
    ], steps: [
      { num: "01", title: "Saisie des informations", text: "Donnez aux agents toutes les informations sur votre entreprise et votre idée." },
      { num: "02", title: "Choisissez votre module", text: "Choisissez les modules d'agents adaptés à votre objectif actuel." },
      { num: "03", title: "Confiez une tâche à vos agents et regardez-les travailler", text: "Assignez une tâche et regardez les agents autonomes l'exécuter de bout en bout." },
      { num: "04", title: "Validez le résultat", text: "Donnez du feedback aux agents jusqu'à ce que le résultat vous convienne." },
      { num: "05", title: "Contactez-nous pour votre configuration individuelle", text: "Nous construisons votre configuration d'agents sur mesure autour de votre entreprise." },
    ] },
    faqTitle: "Questions fréquentes",
    faqs: [
      { q: "Qu'est-ce que NEXUM Intelligence ?", a: "NEXUM Intelligence est une plateforme de solutions technologiques moderne axée sur des systèmes numériques sécurisés, des workflows fluides et la croissance de l'entreprise grâce à l'innovation intelligente." },
      { q: "NEXUM Intelligence est-il dans le cloud ou auto-hébergé ?", a: "Les systèmes peuvent être conçus pour le cloud, l'auto-hébergement ou des besoins hybrides selon votre stack et vos exigences de conformité." },
      { q: "À quel point NEXUM Intelligence est-il sécurisé ?", a: "La sécurité repose sur des accès délimités, des couches de données sécurisées, des workflows auditables et des choix d'architecture adaptés à votre profil de risque." },
      { q: "Puis-je tout gérer depuis un seul tableau de bord ?", a: "Oui. L'idée centrale est le contrôle centralisé des workflows d'IA, le suivi des performances et la gestion des prompts/modèles." },
      { q: "Comment fonctionne la tarification ?", a: "Le prix dépend du périmètre, des intégrations, du niveau de support et de votre besoin : prototype, système de lancement ou infrastructure gérée en continu." },
    ],
    cta: { title: "Prêt à construire votre avantage IA ?" },
    security: {
      pill: "Sécurité & Conformité",
      title: "Conçu en Allemagne. Sécurisé par conception.",
      intro: "Vos données restent protégées. NEXUM Intelligence a son siège en Allemagne, héberge au sein de l'UE et conçoit chaque système selon des normes européennes strictes de protection des données et de sécurité de l'information.",
      items: [
        { name: "RGPD · GDPR", desc: "Conforme au Règlement général sur la protection des données de l'UE." },
        { name: "BDSG", desc: "Aligné sur la loi fédérale allemande sur la protection des données." },
        { name: "ISO/IEC 27001", desc: "Bonnes pratiques de gestion de la sécurité de l'information." },
        { name: "ISO/IEC 27701", desc: "Extension pour la gestion de la confidentialité." },
        { name: "SOC 2 Type II", desc: "Contrôles de sécurité, de disponibilité et de confidentialité." },
        { name: "EU AI Act", desc: "Des systèmes d'IA responsables, transparents et conformes." },
        { name: "BSI IT-Grundschutz", desc: "Référentiel allemand pour la sécurité informatique." },
        { name: "Hébergement UE", desc: "Hébergé dans des centres de données allemands / UE, chiffré en AES-256 & TLS." },
      ],
    },
    footer: { tagline: "Arrêtez de gérer des tâches. Commencez à gérer des systèmes.", links: ["Confiance & impact", "Ce que nous construisons", "Comment fonctionne NEXUM", "Démo cas d'usage", "Pourquoi NEXUM", "Témoignages"] },
    platform: { pill: "Plateforme d'agents", title: "Accédez à votre plateforme d'agents autonomes", signinText: "Connectez-vous pour enregistrer votre analyse de potentiel, comparer des idées d'entreprise et débloquer les recommandations de NEXUM Intelligence pour votre prochaine étape de croissance.", google: "Se connecter avec Google", microsoft: "Se connecter avec Microsoft", email: "E-mail", password: "Mot de passe", scorePill: "ANALYSE DE POTENTIEL", scoreTitle: "Augmentez et faites évoluer votre succès avec NEXUM Intelligence.", scoreIntro: "Décrivez votre idée d'entreprise et laissez la plateforme évaluer à quel point elle peut bénéficier d'agents autonomes, d'automatisation et d'opérations intelligentes.", agentBubble: "Bonjour, je suis votre agent d'analyse. Répondez à quelques questions rapides et j'évaluerai à quel point votre idée peut bénéficier des agents autonomes.", businessIdea: "Idée d'entreprise", businessIdeaPlaceholder: "Décrivez l'idée, le public cible, le processus actuel et le résultat attendu.", fields: { "Business Stage": "Stade de l'entreprise", "Main Objective": "Objectif principal", "Industry Focus": "Secteur", "Automation Maturity": "Maturité d'automatisation" } },
  },
};

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("nexum_lang");
        if (saved && dict[saved]) return saved;
      } catch (e) {}
    }
    return "en";
  });

  const setLang = (code) => {
    if (!dict[code]) return;
    setLangState(code);
    try { window.localStorage.setItem("nexum_lang", code); } catch (e) {}
    try { document.documentElement.lang = code; } catch (e) {}
  };

  useEffect(() => {
    try { document.documentElement.lang = lang; } catch (e) {}
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: dict[lang] || dict.en }}>
      {children}
    </LangContext.Provider>
  );
}

export function useI18n() {
  return useContext(LangContext) || { lang: "en", setLang: () => {}, t: dict.en };
}
