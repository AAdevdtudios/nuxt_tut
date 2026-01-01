<template>
  <DashboardBodyLayout
    title="AI Question Generator"
    description="Upload a PDF and generate practice questions using AI"
  >
    <div class="p-4 lg:p-8 space-y-6 mt-4">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-file-question" class="h-8 w-8 text-primary" />
          AI Question Generator
        </h1>
        <p class="text-muted-foreground mt-2">
          Upload a PDF and generate practice questions using AI
        </p>
      </div>

      <!-- Upload and Configuration Form -->
      <UTabs
        v-if="!quizMode"
        :items="[{ label: 'Generate', value: 'generate' }]"
        v-model="tab"
        class="mb-4"
      />
      <UCard v-if="!quizMode">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
            Generate Questions from PDF
          </div>
          <div class="text-muted-foreground text-sm mt-1">
            Upload your study material and configure question generation
            settings
          </div>
        </template>
        <div class="space-y-6">
          <!-- File Upload -->
          <div class="space-y-2">
            <label class="font-medium">Upload PDF Document *</label>
            <div
              class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center"
            >
              <UIcon
                name="i-lucide-upload"
                class="h-8 w-8 text-muted-foreground mx-auto mb-2"
              />
              <div class="space-y-2">
                <p class="text-sm text-muted-foreground">
                  {{
                    file
                      ? file.name
                      : "Click to upload or drag and drop your PDF file"
                  }}
                </p>
                <UInput
                  type="file"
                  accept=".pdf"
                  @change="handleFileChange"
                  class="max-w-xs mx-auto"
                />
              </div>
            </div>
          </div>

          <!-- Configuration Options -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label>Question Type *</label>
              <USelect
                v-model="formData.questionType"
                :items="questionTypes"
                placeholder="Select question type"
                option-attribute="label"
                value-attribute="value"
              />
            </div>
            <div class="space-y-2">
              <label>Difficulty Level *</label>
              <USelect
                v-model="formData.difficulty"
                :items="difficulties"
                placeholder="Select difficulty"
                option-attribute="label"
                value-attribute="value"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label>Number of Questions</label>
              <USelect
                v-model="formData.numberOfQuestions"
                :items="numberOptions"
                option-attribute="label"
                value-attribute="value"
              />
            </div>
            <div class="space-y-2">
              <label>Focus Area (Optional)</label>
              <UInput
                v-model="formData.focusArea"
                placeholder="e.g., Chapter 3, Photosynthesis"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label>Additional Instructions (Optional)</label>
            <UTextarea
              v-model="formData.additionalInstructions"
              placeholder="Any specific requirements or focus areas for the questions..."
              :rows="3"
            />
          </div>
          <UButton
            :loading="isGenerating"
            :disabled="isGenerating || !file"
            block
            @click="generateQuestions"
          >
            <template #icon
              ><UIcon
                :name="
                  isGenerating ? 'i-lucide-refresh-cw' : 'i-lucide-sparkles'
                "
                class="h-4 w-4"
            /></template>
            {{
              isGenerating ? "Generating Questions..." : "Generate Questions"
            }}
          </UButton>
        </div>
      </UCard>

      <!-- Generated Questions - Start Quiz -->
      <UCard v-if="questions.length > 0 && !quizMode">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold">
                Generated Questions ({{ questions.length }})
              </div>
              <div class="text-muted-foreground text-sm">
                Ready to start your interactive quiz?
              </div>
            </div>
            <UButton
              @click="startQuiz"
              color="primary"
              class="flex items-center gap-2"
            >
              <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
              Start Interactive Quiz
            </UButton>
          </div>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 border rounded-lg">
            <div class="text-2xl font-bold text-primary">
              {{ questions.length }}
            </div>
            <p class="text-sm text-muted-foreground">Total Questions</p>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <div class="text-2xl font-bold text-primary">
              {{ questions.filter((q) => q.type === "multiple-choice").length }}
            </div>
            <p class="text-sm text-muted-foreground">Multiple Choice</p>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <div class="text-2xl font-bold text-primary">
              {{ questions.filter((q) => q.difficulty === "hard").length }}
            </div>
            <p class="text-sm text-muted-foreground">Hard Questions</p>
          </div>
        </div>
        <p class="text-muted-foreground text-center">
          Click "Start Interactive Quiz" to begin answering questions one by one
          with instant feedback!
        </p>
      </UCard>

      <!-- Interactive Quiz Mode -->
      <div
        v-if="quizMode && !quizCompleted && currentQuestion"
        class="space-y-6"
      >
        <UCard>
          <div class="pt-6">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span
                  >Question {{ currentQuestionIndex + 1 }} of
                  {{ questions.length }}</span
                >
                <span>{{ Math.round(progress) }}% Complete</span>
              </div>
              <UProgress :value="progress" class="w-full" />
            </div>
          </div>
        </UCard>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 mb-2">
              <UBadge :color="getTypeColor(currentQuestion.type)">{{
                currentQuestion.type.replace("-", " ")
              }}</UBadge>
              <UBadge :color="getDifficultyColor(currentQuestion.difficulty)">{{
                currentQuestion.difficulty
              }}</UBadge>
            </div>
            <div class="text-xl font-semibold">
              {{ currentQuestion.question }}
            </div>
          </template>
          <div class="space-y-6">
            <!-- Answer Input -->
            <div v-if="!showAnswer" class="space-y-4">
              <URadioGroup
                v-if="
                  currentQuestion.type === 'multiple-choice' &&
                  currentQuestion.options
                "
                v-model="currentAnswer"
              >
                <URadio
                  v-for="(option, index) in currentQuestion.options"
                  :key="index"
                  :value="option"
                >
                  {{ String.fromCharCode(97 + index) }}) {{ option }}
                </URadio>
              </URadioGroup>
              <UInput
                v-else-if="currentQuestion.type === 'short-answer'"
                v-model="currentAnswer"
                placeholder="Enter your answer..."
                class="text-lg"
              />
              <UTextarea
                v-else
                v-model="currentAnswer"
                placeholder="Write your essay answer here..."
                :rows="6"
                class="text-base"
              />
              <UButton
                @click="submitAnswer"
                block
                :disabled="!currentAnswer.trim()"
                >Submit Answer</UButton
              >
            </div>
            <!-- Answer Feedback -->
            <div v-else class="space-y-4">
              <div class="p-4 border rounded-lg bg-muted/50">
                <h4 class="font-semibold mb-2">Your Answer:</h4>
                <p class="text-muted-foreground">{{ currentAnswer }}</p>
              </div>
              <div
                v-if="currentQuestion.answer"
                class="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20"
              >
                <h4 class="font-semibold mb-2 flex items-center gap-2">
                  <UIcon
                    name="i-lucide-check-circle"
                    class="h-4 w-4 text-green-600"
                  />
                  Correct Answer:
                </h4>
                <p class="text-green-700 dark:text-green-300">
                  {{ currentQuestion.answer }}
                </p>
              </div>
              <div
                v-if="currentQuestion.type !== 'essay'"
                :class="[
                  'p-4 border rounded-lg',
                  userAnswers[userAnswers.length - 1]?.isCorrect
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-red-50 dark:bg-red-950/20',
                ]"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      userAnswers[userAnswers.length - 1]?.isCorrect
                        ? 'i-lucide-check-circle'
                        : 'i-lucide-x-circle'
                    "
                    :class="[
                      'h-5 w-5',
                      userAnswers[userAnswers.length - 1]?.isCorrect
                        ? 'text-green-600'
                        : 'text-red-600',
                    ]"
                  />
                  <span
                    :class="[
                      'font-semibold',
                      userAnswers[userAnswers.length - 1]?.isCorrect
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300',
                    ]"
                  >
                    {{
                      userAnswers[userAnswers.length - 1]?.isCorrect
                        ? "Correct!"
                        : "Incorrect"
                    }}
                  </span>
                </div>
              </div>
              <!-- Navigation -->
              <div class="flex justify-between">
                <UButton
                  variant="outline"
                  @click="previousQuestion"
                  :disabled="currentQuestionIndex === 0"
                >
                  <UIcon name="i-lucide-arrow-left" class="h-4 w-4 mr-2" />
                  Previous
                </UButton>
                <UButton @click="nextQuestion">
                  {{
                    currentQuestionIndex === questions.length - 1
                      ? "Finish Quiz"
                      : "Next Question"
                  }}
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4 ml-2" />
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quiz Completed -->
      <UCard v-if="quizCompleted">
        <template #header>
          <div class="text-center text-2xl font-semibold">
            Quiz Completed! 🎉
          </div>
          <div class="text-center text-muted-foreground">
            Here are your results
          </div>
        </template>
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 border rounded-lg">
              <div class="text-3xl font-bold text-primary">
                {{ correctAnswers }}
              </div>
              <p class="text-sm text-muted-foreground">Correct Answers</p>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-3xl font-bold text-primary">
                {{ totalAnswered }}
              </div>
              <p class="text-sm text-muted-foreground">Total Answered</p>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-3xl font-bold text-primary">
                {{
                  totalAnswered > 0
                    ? Math.round((correctAnswers / totalAnswered) * 100)
                    : 0
                }}%
              </div>
              <p class="text-sm text-muted-foreground">Score</p>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              @click="restartQuiz"
              variant="outline"
              class="flex items-center gap-2 bg-transparent"
            >
              <UIcon name="i-lucide-rotate-ccw" class="h-4 w-4" /> Retake Quiz
            </UButton>
            <UButton @click="exportResults" class="flex items-center gap-2">
              <UIcon name="i-lucide-download" class="h-4 w-4" /> Export Results
            </UButton>
            <UButton @click="quizMode = false" variant="outline"
              >Generate New Questions</UButton
            >
          </div>
        </div>
      </UCard>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useToast } from "#imports";

definePageMeta({ layout: "dashboard" });

interface GeneratedQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "short-answer" | "essay";
  options?: string[];
  answer?: string;
  difficulty: "easy" | "medium" | "hard";
}
interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

const questionTypes = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "short-answer", label: "Short Answer" },
  { value: "essay", label: "Essay Questions" },
  { value: "mixed", label: "Mixed Types" },
];
const difficulties = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed Levels" },
];
const numberOptions = [
  { value: "5", label: "5 questions" },
  { value: "10", label: "10 questions" },
  { value: "15", label: "15 questions" },
  { value: "20", label: "20 questions" },
  { value: "25", label: "25 questions" },
];

const file = ref<File | null>(null);
const formData = ref({
  questionType: "",
  difficulty: "",
  numberOfQuestions: "5",
  focusArea: "",
  additionalInstructions: "",
});
const questions = ref<GeneratedQuestion[]>([]);
const isGenerating = ref(false);
const currentQuestionIndex = ref(0);
const userAnswers = ref<UserAnswer[]>([]);
const currentAnswer = ref("");
const showAnswer = ref(false);
const quizMode = ref(false);
const quizCompleted = ref(false);
const startTime = ref<number>(0);
const tab = ref("generate");
const toast = useToast();

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const selectedFile = input.files?.[0];
  if (selectedFile && selectedFile.type === "application/pdf") {
    file.value = selectedFile;
    toast.add({
      title: "PDF Uploaded",
      description: `${selectedFile.name} has been selected for processing.`,
    });
  } else {
    toast.add({
      title: "Invalid File",
      description: "Please select a valid PDF file.",
      color: "error",
    });
  }
};

const generateQuestions = async () => {
  if (!file.value) {
    toast.add({
      title: "No File Selected",
      description: "Please upload a PDF file first.",
      color: "error",
    });
    return;
  }
  if (!formData.value.questionType || !formData.value.difficulty) {
    toast.add({
      title: "Missing Information",
      description: "Please select question type and difficulty level.",
      color: "error",
    });
    return;
  }
  isGenerating.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    // Mock generated questions
    const mockQuestions: GeneratedQuestion[] = [
      {
        id: "1",
        question:
          "What is the primary function of mitochondria in cellular respiration?",
        type: "multiple-choice",
        options: [
          "Protein synthesis",
          "ATP production",
          "DNA replication",
          "Waste removal",
        ],
        answer: "ATP production",
        difficulty: "medium",
      },
      {
        id: "2",
        question:
          "Explain the process of photosynthesis and its importance in the ecosystem.",
        type: "essay",
        difficulty: "hard",
      },
      {
        id: "3",
        question: "What is the chemical formula for glucose?",
        type: "short-answer",
        answer: "C6H12O6",
        difficulty: "easy",
      },
      {
        id: "4",
        question: "Which organelle is responsible for protein synthesis?",
        type: "multiple-choice",
        options: [
          "Nucleus",
          "Ribosome",
          "Golgi apparatus",
          "Endoplasmic reticulum",
        ],
        answer: "Ribosome",
        difficulty: "medium",
      },
      {
        id: "5",
        question:
          "Describe the differences between prokaryotic and eukaryotic cells.",
        type: "essay",
        difficulty: "hard",
      },
    ];
    questions.value = mockQuestions;
    userAnswers.value = [];
    currentQuestionIndex.value = 0;
    currentAnswer.value = "";
    showAnswer.value = false;
    quizMode.value = false;
    quizCompleted.value = false;
    toast.add({
      title: "Questions Generated!",
      description: `Successfully generated ${mockQuestions.length} questions from your PDF.`,
    });
  } catch (error) {
    toast.add({
      title: "Generation Failed",
      description: "There was an error generating questions. Please try again.",
      color: "error",
    });
  } finally {
    isGenerating.value = false;
  }
};

const startQuiz = () => {
  quizMode.value = true;
  currentQuestionIndex.value = 0;
  userAnswers.value = [];
  currentAnswer.value = "";
  showAnswer.value = false;
  quizCompleted.value = false;
  startTime.value = Date.now();
};

const submitAnswer = () => {
  if (!currentAnswer.value.trim()) {
    toast.add({
      title: "No Answer Provided",
      description: "Please provide an answer before submitting.",
      color: "error",
    });
    return;
  }
  const currentQ = questions.value[currentQuestionIndex.value];
  if (!currentQ) return;
  const timeSpent = Date.now() - startTime.value;
  let isCorrect = false;
  if (currentQ.type === "multiple-choice" || currentQ.type === "short-answer") {
    isCorrect =
      currentAnswer.value.toLowerCase().trim() ===
      currentQ.answer?.toLowerCase().trim();
  }
  const newAnswer: UserAnswer = {
    questionId: currentQ.id,
    answer: currentAnswer.value,
    isCorrect: currentQ.type === "essay" ? undefined : isCorrect,
    timeSpent,
  };
  userAnswers.value = [...userAnswers.value, newAnswer];
  showAnswer.value = true;
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    currentAnswer.value = "";
    showAnswer.value = false;
    startTime.value = Date.now();
  } else {
    quizCompleted.value = true;
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    currentAnswer.value = "";
    showAnswer.value = false;
  }
};

const restartQuiz = () => {
  currentQuestionIndex.value = 0;
  userAnswers.value = [];
  currentAnswer.value = "";
  showAnswer.value = false;
  quizCompleted.value = false;
  startTime.value = Date.now();
};

const exportResults = () => {
  const results = questions.value.map((question, index) => {
    const userAnswer = userAnswers.value.find(
      (a) => a.questionId === question.id
    );
    return {
      question: question.question,
      userAnswer: userAnswer?.answer || "Not answered",
      correctAnswer: question.answer || "N/A",
      isCorrect: userAnswer?.isCorrect,
      timeSpent: userAnswer?.timeSpent
        ? Math.round(userAnswer.timeSpent / 1000)
        : 0,
    };
  });
  const resultsText = results
    .map((result, index) => {
      let text = `Question ${index + 1}: ${result.question}\n`;
      text += `Your Answer: ${result.userAnswer}\n`;
      text += `Correct Answer: ${result.correctAnswer}\n`;
      text += `Result: ${
        result.isCorrect === undefined
          ? "Essay Question"
          : result.isCorrect
          ? "Correct"
          : "Incorrect"
      }\n`;
      text += `Time Spent: ${result.timeSpent} seconds\n\n`;
      return text;
    })
    .join("");
  const blob = new Blob([resultsText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quiz-results.txt";
  a.click();
  URL.revokeObjectURL(url);
  toast.add({
    title: "Results Exported",
    description: "Quiz results have been downloaded as a text file.",
  });
};

function getDifficultyColor(
  difficulty: string
):
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral"
  | undefined {
  switch (difficulty) {
    case "easy":
      return "success";
    case "medium":
      return "warning";
    case "hard":
      return "error";
    default:
      return "neutral";
  }
}
function getTypeColor(
  type: string
):
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral"
  | undefined {
  switch (type) {
    case "multiple-choice":
      return "primary";
    case "short-answer":
      return "info";
    case "essay":
      return "secondary";
    default:
      return "neutral";
  }
}

const currentQuestion = computed(
  () => questions.value[currentQuestionIndex.value]
);
const progress = computed(() =>
  questions.value.length > 0
    ? ((currentQuestionIndex.value + 1) / questions.value.length) * 100
    : 0
);
const correctAnswers = computed(
  () => userAnswers.value.filter((a) => a.isCorrect === true).length
);
const totalAnswered = computed(
  () => userAnswers.value.filter((a) => a.isCorrect !== undefined).length
);
</script>
