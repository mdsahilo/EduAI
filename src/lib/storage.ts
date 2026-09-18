import { DocumentItem, QuizResult, StudyPlan, UserProfile, WeakTopicAnalysis } from '../types';

const SAMPLE_DOCS_KEY = 'eduai_documents_';
const SAMPLE_QUIZZES_KEY = 'eduai_quizzes_';
const SAMPLE_PLANS_KEY = 'eduai_plans_';
const USER_KEY = 'eduai_user_session';

// Built-in starter document so students have immediate hands-on access even before uploading
export const DEFAULT_COMPUTER_NETWORKS_DOC: DocumentItem = {
  id: 'doc_cn_unit1',
  name: 'Computer Networks Unit 1 - Fundamentals & OSI Model.pdf',
  size: 342000,
  uploadedAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  pageCount: 14,
  extractedText: `Computer Networks Unit 1: Architecture, OSI Model, TCP/IP Suite, and Congestion Control.

1. Open Systems Interconnection (OSI) Reference Model:
The OSI model is a 7-layer theoretical conceptual model developed by the International Organization for Standardization (ISO) in 1984:
- Layer 7: Application Layer (HTTP, FTP, SMTP, DNS). Responsible for user interaction and network services.
- Layer 6: Presentation Layer (SSL/TLS, ASCII, JPEG). Handles data translation, encryption/decryption, and data compression.
- Layer 5: Session Layer (RPC, NetBIOS). Establishes, maintains, coordinates, and terminates communication sessions between endpoints.
- Layer 4: Transport Layer (TCP, UDP). Provides end-to-end communication, flow control, error recovery, segmentation, and multiplexing.
- Layer 3: Network Layer (IP, ICMP, IGMP). Handles logical packet addressing, routing decisions, path determination, and fragmentation across multiple subnets.
- Layer 2: Data Link Layer (Ethernet, MAC, PPP, ARP). Ensures node-to-node frame delivery, physical addressing (MAC address), framing, and media access control.
- Layer 1: Physical Layer (Cables, Fiber optics, RF signals, Bits). Handles the physical transmission of raw unstructured bit streams over physical transmission mediums.

2. TCP Congestion Control Mechanisms:
TCP uses adaptive feedback mechanisms to throttle transmission rates based on estimated network capacity:
- Slow Start: Starts with Congestion Window (cwnd) = 1 MSS (Maximum Segment Size). cwnd doubles every Round Trip Time (RTT) until reaching ssthresh (slow start threshold).
- Congestion Avoidance: Once cwnd >= ssthresh, growth switches from exponential to linear (additive increase), incrementing cwnd by 1 MSS per RTT.
- Fast Retransmit: Triggered by 3 duplicate ACKs before a timeout expires. The sender infers a single lost segment without waiting for the full retransmission timeout.
- Fast Recovery: Halves cwnd, sets ssthresh = cwnd/2, and enters additive increase directly rather than resetting back to 1 MSS.

3. Flow Control vs Congestion Control:
- Flow Control prevents the sender from overwhelming a slow receiver (Receiver Window, rwnd advertised in TCP header).
- Congestion Control prevents senders collectively from congesting intermediate network routers and buffers (Congestion Window, cwnd).

4. IP Addressing and Subnetting:
- IPv4 uses 32-bit addresses formatted in dotted decimal (e.g. 192.168.1.1).
- Classless Inter-Domain Routing (CIDR) uses slash notation (e.g., /24 provides 256 addresses, 254 usable hosts).
- Subnet masks differentiate the network prefix from the host identifier.`,
  summary: 'Comprehensive college notes covering the 7-layer ISO/OSI model, TCP end-to-end transport protocols, TCP congestion control algorithms (Slow Start, Congestion Avoidance, Fast Retransmit/Recovery), and IPv4 subnetting architectures.',
  topics: ['OSI 7-Layer Architecture', 'TCP vs UDP Protocols', 'TCP Congestion Control', 'Flow Control & Sliding Window', 'IPv4 Addressing & CIDR Subnetting'],
};

export const DEFAULT_QUIZ_RESULTS: QuizResult[] = [
  {
    id: 'quiz_seed_1',
    docId: 'doc_cn_unit1',
    docTitle: 'Computer Networks Unit 1 - Fundamentals & OSI Model.pdf',
    totalQuestions: 5,
    correctCount: 4,
    scorePercentage: 80,
    date: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    userAnswers: { 'q1': 0, 'q2': 1, 'q3': 2, 'q4': 1, 'q5': 0 },
    questions: [
      {
        id: 'q1',
        question: 'Which OSI layer handles logical packet addressing and path routing?',
        options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Session Layer'],
        correctAnswer: 0,
        explanation: 'The Network Layer (Layer 3) handles IP addressing, packet forwarding, and path selection.',
        topic: 'OSI 7-Layer Architecture',
      },
      {
        id: 'q2',
        question: 'What triggers Fast Retransmit in TCP?',
        options: ['Timeout timer expiration', 'Reception of 3 duplicate ACKs', 'Explicit ECN bit only', 'Window size reset to 0'],
        correctAnswer: 1,
        explanation: 'Three duplicate ACKs prompt the sender to immediately resend the missing segment without waiting for RTO.',
        topic: 'TCP Congestion Control',
      },
      {
        id: 'q3',
        question: 'In TCP Slow Start, how does the congestion window (cwnd) increase?',
        options: ['Linearly by 1 MSS every RTT', 'Stays constant', 'Exponentially, doubling each RTT', 'Randomly'],
        correctAnswer: 2,
        explanation: 'During slow start, cwnd doubles each round-trip time until reaching ssthresh.',
        topic: 'TCP Congestion Control',
      },
      {
        id: 'q4',
        question: 'What is the primary role of the Presentation Layer (Layer 6)?',
        options: ['Electrical bit transmission', 'Data syntax translation, encryption, and compression', 'End-to-end reliable delivery', 'Routing between autonomous systems'],
        correctAnswer: 1,
        explanation: 'Presentation layer handles serialization, syntax translation, SSL/TLS encryption, and formatting.',
        topic: 'OSI 7-Layer Architecture',
      },
      {
        id: 'q5',
        question: 'What is the difference between flow control and congestion control?',
        options: ['Flow control protects receiver buffer; congestion control protects network routers', 'They are completely identical', 'Congestion control only exists in UDP', 'Flow control manages IP packet TTL'],
        correctAnswer: 0,
        explanation: 'Flow control is endpoint-to-endpoint buffering, while congestion control protects shared network fabric.',
        topic: 'Flow Control & Sliding Window',
      }
    ],
    topicScores: {
      'OSI 7-Layer Architecture': { correct: 2, total: 2, percentage: 100 },
      'TCP Congestion Control': { correct: 1, total: 2, percentage: 50 },
      'Flow Control & Sliding Window': { correct: 1, total: 1, percentage: 100 },
    },
  },
];

export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const StorageService = {
  getUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  getDocuments(uid: string): DocumentItem[] {
    const raw = localStorage.getItem(SAMPLE_DOCS_KEY + uid);
    if (!raw) {
      const initial = [DEFAULT_COMPUTER_NETWORKS_DOC];
      localStorage.setItem(SAMPLE_DOCS_KEY + uid, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [DEFAULT_COMPUTER_NETWORKS_DOC];
    }
  },

  saveDocument(uid: string, doc: DocumentItem) {
    if (doc.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error('File is too large. Please upload a PDF smaller than 50MB.');
    }

    const docs = this.getDocuments(uid);
    const existingIndex = docs.findIndex((d) => d.id === doc.id);
    if (existingIndex >= 0) {
      docs[existingIndex] = doc;
    } else {
      docs.unshift(doc);
    }

    try {
      localStorage.setItem(SAMPLE_DOCS_KEY + uid, JSON.stringify(docs));
    } catch (quotaErr) {
      console.warn('LocalStorage quota limit reached when persisting document. Optimizing document text cache...', quotaErr);
      // Keep active/new document intact, trim older extractedText caches to prevent quota crash
      const optimizedDocs = docs.map((d, index) => {
        if (index === 0) return d;
        return {
          ...d,
          extractedText: d.extractedText ? d.extractedText.slice(0, 50000) : '',
        };
      });
      try {
        localStorage.setItem(SAMPLE_DOCS_KEY + uid, JSON.stringify(optimizedDocs));
      } catch {
        const minimalDocs = docs.map((d, index) => ({
          ...d,
          extractedText: index === 0 ? d.extractedText.slice(0, 100000) : d.extractedText.slice(0, 10000),
        }));
        localStorage.setItem(SAMPLE_DOCS_KEY + uid, JSON.stringify(minimalDocs));
      }
    }
  },

  deleteDocument(uid: string, docId: string) {
    const docs = this.getDocuments(uid).filter(d => d.id !== docId);
    localStorage.setItem(SAMPLE_DOCS_KEY + uid, JSON.stringify(docs));
  },

  getQuizzes(uid: string): QuizResult[] {
    const raw = localStorage.getItem(SAMPLE_QUIZZES_KEY + uid);
    if (!raw) {
      localStorage.setItem(SAMPLE_QUIZZES_KEY + uid, JSON.stringify(DEFAULT_QUIZ_RESULTS));
      return DEFAULT_QUIZ_RESULTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_QUIZ_RESULTS;
    }
  },

  saveQuizResult(uid: string, result: QuizResult) {
    const results = this.getQuizzes(uid);
    results.unshift(result);
    localStorage.setItem(SAMPLE_QUIZZES_KEY + uid, JSON.stringify(results));
  },

  getStudyPlans(uid: string): StudyPlan[] {
    const raw = localStorage.getItem(SAMPLE_PLANS_KEY + uid);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveStudyPlan(uid: string, plan: StudyPlan) {
    const plans = this.getStudyPlans(uid);
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.unshift(plan);
    }
    localStorage.setItem(SAMPLE_PLANS_KEY + uid, JSON.stringify(plans));
  },

  computeWeakTopics(uid: string): WeakTopicAnalysis[] {
    const quizzes = this.getQuizzes(uid);
    const topicStats: { [topic: string]: { correct: number; total: number } } = {};

    quizzes.forEach(quiz => {
      quiz.questions.forEach(q => {
        const t = q.topic || 'General';
        if (!topicStats[t]) {
          topicStats[t] = { correct: 0, total: 0 };
        }
        topicStats[t].total += 1;
        if (quiz.userAnswers[q.id] === q.correctAnswer) {
          topicStats[t].correct += 1;
        }
      });
    });

    const weak: WeakTopicAnalysis[] = [];
    Object.entries(topicStats).forEach(([topic, stat]) => {
      const accuracy = Math.round((stat.correct / stat.total) * 100);
      if (accuracy < 70) {
        weak.push({
          topic,
          accuracy,
          totalQuestions: stat.total,
          priority: accuracy < 50 ? 'High' : 'Medium',
          recommendation: `Revise "${topic}" first with AI Tutor and take a targeted 5-question practice quiz.`,
        });
      }
    });

    return weak.sort((a, b) => a.accuracy - b.accuracy);
  },
};
