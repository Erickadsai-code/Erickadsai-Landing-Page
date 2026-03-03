import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Target,
  Bot,
  Calendar,
  BarChart3,
  Clock,
  Database,
  ShieldCheck,
  Star,
  Users,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";

// Configuración de Firebase (proporcionada por el entorno)
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "demo-key",
        authDomain: "demo.firebaseapp.com",
        projectId: "demo-project",
        storageBucket: "demo.appspot.com",
        messagingSenderId: "000000000",
        appId: "1:000000000:web:000000000",
      };

const appId = typeof __app_id !== "undefined" ? __app_id : "clinica-premium-v1";

const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Estado del Formulario Multi-paso
  const [step, setStep] = useState(1);
  const [isQualified, setIsQualified] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    revenue: "",
    decisionMaker: "",
    timeframe: "",
    pastInvestment: "",
    challenges: [],
    investWillingness: "",
    whatsappConfirm: "",
    otherDecisionMakers: "",
    termsAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'

  // Inicialización de Firebase
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const firebaseAuth = getAuth(app);

    setDb(firestore);
    setAuth(firebaseAuth);

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined") {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      }
    });

    initAuth();
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "challenges") {
      const updatedChallenges = checked
        ? [...formData.challenges, value]
        : formData.challenges.filter((c) => c !== value);
      setFormData((prev) => ({ ...prev, challenges: updatedChallenges }));
    } else if (type === "checkbox" && name === "termsAccepted") {
      setFormData((prev) => ({ ...prev, termsAccepted: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Función para evaluar calificación (se ejecuta al final)
  const evaluateQualification = () => {
    const hasRevenue =
      formData.revenue === "$30.000 USD - $50.000 USD" ||
      formData.revenue === "Más de $50.000 USD";
    const hasTimeframe = formData.timeframe !== "Solo estoy explorando";
    const isWilling =
      formData.investWillingness === "Si" ||
      formData.investWillingness === "Depende del plan";
    const willConfirm =
      formData.whatsappConfirm === "Sí, lo entiendo y contestaré.";

    const qualified = hasRevenue && hasTimeframe && isWilling && willConfirm;
    setIsQualified(qualified);
    return qualified;
  };

  const nextStep = () => {
    if (step < 9) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthReady || !db || !formData.termsAccepted) return;

    setIsSubmitting(true);
    const qualifiedResult = evaluateQualification();

    try {
      const publicDataPath = `/artifacts/${appId}/public/data/leads`;
      await addDoc(collection(db, publicDataPath), {
        ...formData,
        userId: userId,
        timestamp: serverTimestamp(),
        source: "Landing Page Premium",
        qualified: qualifiedResult,
      });
      setSubmitStatus("success");
      setShowResult(true);
    } catch (error) {
      console.error("Error saving lead:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (showResult && !isQualified) {
      return (
        <div className="text-center py-10 animate-in fade-in duration-500">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
          <h3 className="text-2xl font-bold mb-4 text-neutral-800">
            Evaluación Completada
          </h3>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            Gracias por tu interés. Basado en tus respuestas, parece que tu
            clínica aún no se encuentra en la etapa ideal para implementar
            nuestra infraestructura premium de escalado.
          </p>
          <div className="p-4 bg-neutral-100 rounded-xl text-sm text-neutral-500">
            Guardaremos tu contacto para futuras actualizaciones cuando tu
            facturación supere los $30k USD mensuales.
          </div>
          <button
            onClick={() => {
              setStep(1);
              setShowResult(false);
              setIsQualified(true);
            }}
            className="mt-6 text-[#5eedf8] font-bold hover:underline"
          >
            Editar mis respuestas
          </button>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-2">Información de Contacto</h3>
            <p className="text-sm text-neutral-500 mb-4 italic">
              Paso inicial para tu auditoría
            </p>
            <input
              required
              type="text"
              name="name"
              placeholder="Nombre Completo"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-4 rounded-xl bg-neutral-100 outline-none focus:ring-2 focus:ring-[#5eedf8]"
            />
            <input
              required
              type="tel"
              name="phone"
              placeholder="Teléfono / WhatsApp"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full p-4 rounded-xl bg-neutral-100 outline-none focus:ring-2 focus:ring-[#5eedf8]"
            />
            <input
              required
              type="email"
              name="email"
              placeholder="Correo Electrónico"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-4 rounded-xl bg-neutral-100 outline-none focus:ring-2 focus:ring-[#5eedf8]"
            />
            <button
              onClick={() =>
                formData.name && formData.phone && formData.email && nextStep()
              }
              className="w-full py-4 bg-[#5eedf8] text-black font-bold rounded-xl mt-4"
            >
              Siguiente
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold mb-4">
              ¿Cuál es tu ingreso mensual promedio?
            </h3>
            {[
              "Menos de $500 USD",
              "$500 USD - $1.000 USD",
              "$1.000 USD - $3.000 USD",
              "$3.000 USD - $10.000 USD",
              "$30.000 USD - $50.000 USD",
              "Más de $50.000 USD",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setFormData({ ...formData, revenue: opt });
                  nextStep();
                }}
                className={`w-full p-4 text-left rounded-xl transition-all text-sm font-medium ${
                  formData.revenue === opt
                    ? "bg-[#5eedf8] text-black"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold mb-4">
              ¿Eres quien toma la decisión final?
            </h3>
            {["Si", "Lo consulto con socios", "No"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setFormData({ ...formData, decisionMaker: opt });
                  nextStep();
                }}
                className={`w-full p-4 text-left rounded-xl transition-all text-sm font-medium ${
                  formData.decisionMaker === opt
                    ? "bg-[#5eedf8] text-black"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold mb-4">
              ¿En qué plazo te gustaría implementar este sistema?
            </h3>
            {[
              "Inmediatamente",
              "30 días",
              "60–90 días",
              "Solo estoy explorando",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setFormData({ ...formData, timeframe: opt });
                  nextStep();
                }}
                className={`w-full p-4 text-left rounded-xl transition-all text-sm font-medium ${
                  formData.timeframe === opt
                    ? "bg-[#5eedf8] text-black"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold mb-4">
              ¿Has invertido antes en publicidad digital?
            </h3>
            {["Sí, actualmente", "Sí, en el pasado", "Nunca"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setFormData({ ...formData, pastInvestment: opt });
                  nextStep();
                }}
                className={`w-full p-4 text-left rounded-xl transition-all text-sm font-medium ${
                  formData.pastInvestment === opt
                    ? "bg-[#5eedf8] text-black"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold mb-4">
              ¿Estás dispuesto a invertir en implementar el sistema?
            </h3>
            {["Si", "Depende del plan", "Por ahora no"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setFormData({ ...formData, investWillingness: opt });
                  nextStep();
                }}
                className={`w-full p-4 text-left rounded-xl transition-all text-sm font-medium ${
                  formData.investWillingness === opt
                    ? "bg-[#5eedf8] text-black"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-bold mb-2">Compromiso de Contacto</h3>
            <p className="text-xs text-neutral-500 mb-4 italic">
              Te contactaremos para confirmar tu cita. Si no respondes,
              cancelaremos la llamada.
            </p>
            {[
              "Sí, lo entiendo y contestaré.",
              "No, no contestaré, soy un bot, curioso o te estoy copiando el funnel.",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setFormData({ ...formData, whatsappConfirm: opt });
                  nextStep();
                }}
                className={`w-full p-4 text-left rounded-xl transition-all text-sm font-medium ${
                  formData.whatsappConfirm === opt
                    ? "bg-[#5eedf8] text-black"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 8:
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold mb-4">
              ¿Cuál es tu mayor desafío hoy?
            </h3>
            {[
              "No tengo suficientes clientes",
              "No convierto bien los leads",
              "Respondo tarde",
              "No tengo automatización",
              "Otro",
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
                  formData.challenges.includes(opt)
                    ? "bg-[#5eedf8]/20 border border-[#5eedf8]"
                    : "bg-neutral-100 hover:bg-[#5eedf8]/10"
                }`}
              >
                <input
                  type="checkbox"
                  name="challenges"
                  value={opt}
                  checked={formData.challenges.includes(opt)}
                  onChange={handleInputChange}
                  className="w-5 h-5 accent-[#5eedf8]"
                />
                <span className="text-sm font-medium">{opt}</span>
              </label>
            ))}
            <button
              onClick={() => formData.challenges.length > 0 && nextStep()}
              className="w-full py-4 bg-[#5eedf8] text-black font-bold rounded-xl mt-4"
            >
              Siguiente
            </button>
          </div>
        );
      case 9:
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-neutral-800 italic">
              Validación Final
            </h3>
            <div>
              <p className="text-sm font-semibold mb-3">
                ¿Existe otro tomador de decisiones que deba asistir?
              </p>
              {[
                "Sí, asistirán conmigo",
                "Si, pero no pueden asistir",
                "No, yo tomo las decisiones",
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 mb-2 p-3 bg-neutral-50 rounded-lg cursor-pointer border border-neutral-200"
                >
                  <input
                    type="radio"
                    name="otherDecisionMakers"
                    value={opt}
                    checked={formData.otherDecisionMakers === opt}
                    onChange={handleInputChange}
                    className="accent-[#5eedf8]"
                  />
                  <span className="text-xs">{opt}</span>
                </label>
              ))}
            </div>
            <label className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="mt-1 w-5 h-5 accent-[#5eedf8]"
              />
              <span className="text-[10px] text-neutral-600 leading-tight">
                Acepto los términos y condiciones. Al marcar esta casilla,
                acepto recibir mensajes de marketing y promocionales, incluyendo
                ofertas especiales, descuentos, novedades sobre productos, entre
                otros. <strong>Acepto.</strong>
              </span>
            </label>
            <button
              disabled={isSubmitting || !formData.termsAccepted}
              onClick={handleSubmit}
              className={`w-full py-5 rounded-xl text-xl font-bold transition-all ${
                isSubmitting
                  ? "bg-neutral-300"
                  : "bg-[#5eedf8] text-black shadow-lg shadow-[#5eedf8]/20 hover:scale-105"
              }`}
            >
              {isSubmitting ? "PROCESANDO..." : "SOLICITAR AUDITORÍA"}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-[#5eedf8]/30 scroll-smooth">
      {/* HEADER / HERO */}
      <header className="relative bg-neutral-900 text-white overflow-hidden border-b border-[#5eedf8]/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#5eedf8]/10 via-transparent to-transparent"></div>
        </div>

        <nav className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
          <div className="text-2xl font-bold tracking-tighter text-[#5eedf8] italic uppercase">
            ERICK ADS AI
          </div>
          <a
            href="#pre-qualification"
            className="hidden md:block bg-[#5eedf8] hover:bg-[#4ddce9] text-black px-6 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-[#5eedf8]/20"
          >
            Solicitar Auditoría Gratis
          </a>
        </nav>

        <div className="container mx-auto px-6 py-16 lg:py-24 relative z-10 text-center max-w-5xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#5eedf8]/10 text-[#5eedf8] text-xs font-bold uppercase tracking-widest mb-6 border border-[#5eedf8]/20">
            Sistemas Automatizados con IA para Clínicas Estéticas
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight leading-tight uppercase">
            REDUCE ESTRÉS Y OBTÉN MÁS CONTROL EN TU CLÍNICA CON{" "}
            <span className="text-[#5eedf8]">
              SISTEMAS DE INTELIGENCIA ARTIFICIAL
            </span>{" "}
            ESTE 2026
          </h1>

          <p className="text-xl md:text-2xl text-neutral-300 font-medium leading-relaxed mb-10 max-w-4xl mx-auto italic px-4">
            "INSTALAMOS EN TU CLINICA ESTÉTICA UN SISTEMA DE ADQUISICIÓN Y
            CONVERSIÓN QUE REDUCE HASTA UN 30% TU COSTO EN PUBLICIDAD Y
            AUTOMATIZA HASTA EL 40% DE TU OPERACIÓN CON IA."
          </p>

          {/* VSL VIDEO AREA */}
          <div className="max-w-4xl mx-auto mb-10 px-4">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-[#5eedf8]/10 bg-neutral-800 border border-neutral-700">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-neutral-900 to-neutral-800 group">
                <div className="text-center p-12">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[#5eedf8] rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-[#5eedf8]/40">
                    <Zap className="text-black fill-current" size={32} />
                  </div>
                  <p className="text-[#5eedf8] font-bold text-lg md:text-xl uppercase tracking-widest group-hover:tracking-wider transition-all">
                    Ver Video de Presentación
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 justify-center items-center">
            <a
              href="#pre-qualification"
              className="w-full sm:w-auto px-12 py-6 bg-[#5eedf8] hover:bg-[#4ddce9] text-black rounded-2xl text-xl font-extrabold flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl shadow-[#5eedf8]/20"
            >
              SOLICITAR AUDITORÍA GRATUITA <ArrowRight size={24} />
            </a>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-wider">
              Cupos limitados Solo 3 Clinicas por Mes.
            </p>
          </div>
        </div>
      </header>

      {/* PAIN POINTS SECTION */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-16 text-neutral-800">
              Si tu clínica tiene alguno de estos dolores, esto es para ti:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 text-left">
              {[
                "Leads que preguntan precio y desaparecen",
                "Secretarias saturadas y estresadas",
                "Mensajes sin seguimiento inmediato",
                "Citas que no se presentan (No-shows)",
                "Agenda impredecible y huecos vacíos",
                "Dinero quemado en publicidad sin retorno",
                "Falta de control real del funnel",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-100 transition-hover hover:border-[#5eedf8]/30 group"
                >
                  <XCircle
                    className="text-red-500 group-hover:scale-110 transition-transform"
                    size={24}
                  />
                  <span className="text-lg font-medium text-neutral-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* SECCION CTA INTERMEDIA */}
            <div className="mb-16">
              <a
                href="#pre-qualification"
                className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all hover:scale-105 group"
              >
                Solicitar Auditoría Gratis{" "}
                <ArrowRight
                  size={20}
                  className="text-[#5eedf8] group-hover:translate-x-1 transition-transform"
                />
              </a>
            </div>

            <div className="p-8 bg-neutral-900 rounded-3xl text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5eedf8]/10 rounded-full blur-3xl"></div>
              <p className="text-2xl font-light italic leading-relaxed">
                "Si tienes máquinas de{" "}
                <span className="text-[#5eedf8] font-bold">$50.000 USD</span> y
                horas de camilla vacías, el problema no es la demanda.{" "}
                <span className="underline decoration-[#5eedf8]">
                  Es el sistema.
                </span>
                "
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER / SOLUTION SECTION */}
      <section className="py-24 bg-neutral-50 border-y border-neutral-200">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">
              Lo que instalamos en 30 días
            </h2>
            <p className="text-neutral-600 text-lg">
              Infraestructura comercial diseñada para escalar Medicina Estética.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<Target size={28} />}
              title="1. Atracción Estratégica"
              description="Campañas en Meta enfocadas en 1 tratamiento high-ticket. Nada de promociones generales ni volumen vacío."
            />
            <FeatureCard
              icon={<Bot size={28} />}
              title="2. Filtro Inteligente 24/7"
              description="Sistema conversacional que califica intención real, filtra curiosos y envía solo pacientes calificados a agenda."
            />
            <FeatureCard
              icon={<Calendar size={28} />}
              title="3. Agenda Preconfirmada"
              description="Agendamiento automático con confirmación inmediata y recordatorios estratégicos 24h antes."
            />
            <FeatureCard
              icon={<Clock size={28} />}
              title="4. Reducción de No-Shows"
              description="Secuencia inteligente de confirmación obligatoria y lista de espera automática para rellenar huecos."
            />
            <FeatureCard
              icon={<Database size={28} />}
              title="5. Reactivación de Base de Datos"
              description="Recuperamos conversaciones muertas y leads antiguos. Dinero que ya pagaste y hoy está perdido."
            />
            <FeatureCard
              icon={<BarChart3 size={28} />}
              title="6. Métricas de Control Total"
              description="Mensajes, leads, citas confirmadas y asistencia real. Dejas de adivinar y empiezas a controlar."
            />
          </div>

          <div className="text-center">
            <a
              href="#pre-qualification"
              className="inline-flex items-center gap-2 px-10 py-5 bg-[#5eedf8] text-black font-extrabold rounded-2xl hover:bg-[#4ddce9] transition-all hover:scale-105 shadow-xl shadow-[#5eedf8]/20"
            >
              Solicitar Auditoría Gratis <ArrowRight size={22} />
            </a>
          </div>
        </div>
      </section>

      {/* PRE-QUALIFICATION FORM SECTION */}
      <section
        id="pre-qualification"
        className="py-24 bg-neutral-900 text-white relative"
      >
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold mb-8 text-[#5eedf8]">
                ¿Es tu clínica apta para este sistema?
              </h2>
              <p className="text-neutral-300 text-lg mb-8 leading-relaxed">
                Buscamos socios estratégicos que cumplan con requisitos de
                facturación e inversión para garantizar resultados reales.
              </p>
              <div className="p-6 border border-[#5eedf8]/20 bg-[#5eedf8]/5 rounded-2xl mb-8">
                <ShieldCheck className="text-[#5eedf8] mb-4" size={32} />
                <h3 className="text-xl font-bold mb-2 text-white italic">
                  Garantía Erick Ads AI
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Si en 60 días no generamos mínimo 15 citas calificadas reales,
                  trabajamos gratis hasta lograrlo. Si en 90 días no hay
                  resultados medibles, devolvemos el 100% del fee.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 lg:p-12 text-neutral-900 shadow-2xl min-h-[550px] flex flex-col justify-start relative overflow-hidden">
              {/* Progress Bar Top */}
              {!showResult && (
                <div className="absolute top-0 left-0 w-full h-2 bg-neutral-100">
                  <div
                    className="h-full bg-[#5eedf8] transition-all duration-700 ease-out shadow-[0_0_10px_#5eedf8]"
                    style={{ width: `${(step / 9) * 100}%` }}
                  ></div>
                </div>
              )}

              {submitStatus === "success" && isQualified && showResult ? (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 italic uppercase">
                    ¡Has Calificado!
                  </h3>
                  <p className="text-neutral-600 mb-8">
                    Un estratega senior de nuestro equipo te contactará vía
                    WhatsApp en las próximas 24 horas para agendar tu sesión de
                    auditoría personalizada.
                  </p>
                  <div className="p-4 bg-neutral-50 rounded-xl text-xs font-bold text-neutral-400 border border-neutral-100">
                    ESTADO: PRIORIDAD ALTA
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col mb-8">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                      Estás cada vez más cerca del cambio en tus proceso
                    </div>
                    <h4 className="text-lg font-bold text-neutral-800">
                      Responde este formulario para poder brindarte una
                      auditoría personalizada
                    </h4>
                    {step > 1 && !showResult && (
                      <button
                        onClick={prevStep}
                        className="mt-4 flex items-center text-xs font-bold text-neutral-500 hover:text-black w-fit group"
                      >
                        <ChevronLeft
                          size={16}
                          className="group-hover:-translate-x-1 transition-transform"
                        />{" "}
                        Volver al paso anterior
                      </button>
                    )}
                  </div>

                  {renderStep()}

                  {!showResult && (
                    <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-400">
                        PASO {step} / 9
                      </span>
                      <div className="flex gap-1">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-4 rounded-full transition-all ${
                              i < step ? "bg-[#5eedf8]" : "bg-neutral-200"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-neutral-800 italic uppercase">
              Esto dicen nuestros clientes
            </h2>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="text-[#5eedf8] fill-current"
                  size={20}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            <TestimonialCard
              name="Dra. Elena Martínez"
              role="Clínica Estética Avanzada"
              quote="Pasamos de tener 15 leads 'preguntones' al día a 3 citas confirmadas y prepagadas. El cambio en la facturación fue inmediato."
            />
            <TestimonialCard
              name="Dr. Ricardo Somoza"
              role="Instituto de Medicina Regenerativa"
              quote="Lo mejor no es solo la agenda llena, sino el control. Ahora sé exactamente cuánto me cuesta traer a un paciente de $2,000 USD."
            />
            <TestimonialCard
              name="Carmen J. - Business Manager"
              role="Luxury Skin Center"
              quote="Mis recepcionistas ahora solo se enfocan en atender a los que ya están en la sala. El sistema hace todo el trabajo de seguimiento."
            />
          </div>

          <div className="text-center">
            <a
              href="#pre-qualification"
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all hover:scale-105 group"
            >
              Solicitar Auditoría Gratis{" "}
              <ArrowRight size={20} className="text-[#5eedf8]" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 text-neutral-500 py-12 border-t border-neutral-900">
        <div className="container mx-auto px-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div>
              <div className="text-xl font-bold tracking-tighter text-[#5eedf8] italic mb-2 uppercase">
                ERICK ADS AI
              </div>
              <p className="text-sm max-w-xs">
                Sistema de agendamiento y adquisición impulsado por IA para
                Estéticas.
              </p>
            </div>
            <div className="flex gap-8 text-sm font-medium">
              <a href="#" className="hover:text-[#5eedf8] transition-colors">
                Términos
              </a>
              <a href="#" className="hover:text-[#5eedf8] transition-colors">
                Privacidad
              </a>
              <a href="#" className="hover:text-[#5eedf8] transition-colors">
                Garantía
              </a>
            </div>
            <div className="text-xs">
              <p>
                User ID:{" "}
                <span className="text-neutral-700 font-mono">
                  {userId || "Cargando..."}
                </span>
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-neutral-900 text-center text-xs opacity-50">
            © 2026 Erick Ads AI. Todos los derechos reservados. No somos una
            agencia, Somos optimizadores de procesos.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-3xl border border-neutral-100 hover:shadow-2xl hover:shadow-[#5eedf8]/10 transition-all group">
    <div className="w-16 h-16 bg-[#5eedf8] text-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#5eedf8]/20">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-neutral-800">{title}</h3>
    <p className="text-neutral-600 leading-relaxed text-sm">{description}</p>
  </div>
);

const TestimonialCard = ({ name, role, quote }) => (
  <div className="p-8 bg-neutral-50 rounded-3xl relative overflow-hidden group hover:bg-neutral-100 transition-colors">
    <div className="mb-6">
      <Users className="text-[#5eedf8]/10 absolute top-4 right-4" size={40} />
      <p className="text-neutral-700 italic leading-relaxed relative z-10 font-medium">
        "{quote}"
      </p>
    </div>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[#5eedf8]/20 rounded-full flex items-center justify-center font-bold text-neutral-800">
        {name[0]}
      </div>
      <div>
        <h4 className="font-bold text-sm text-neutral-800">{name}</h4>
        <p className="text-xs text-neutral-500">{role}</p>
      </div>
    </div>
  </div>
);

export default App;
