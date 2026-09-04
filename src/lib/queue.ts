type JobStatus = "waiting" | "active" | "completed" | "failed" | "delayed" | "paused";

interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  progress: number;
  result?: unknown;
  error?: string;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  priority?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  timeout?: number;
}

type JobProcessor<T = unknown> = (job: Job<T>) => Promise<unknown>;

interface QueueEvents {
  jobAdded: (jobId: string) => void;
  jobCompleted: (jobId: string, result: unknown) => void;
  jobFailed: (jobId: string, error: string) => void;
  jobProgress: (jobId: string, progress: number) => void;
}

export class Queue<TData = unknown> {
  private jobs = new Map<string, Job<TData>>();
  private processors = new Map<string, JobProcessor<TData>>();
  private processing = new Set<string>();
  private concurrency: number;
  private handlers: Partial<QueueEvents> = {};
  private isPaused = false;

  constructor(
    public readonly name: string,
    options: { concurrency?: number } = {}
  ) {
    this.concurrency = options.concurrency ?? 5;
  }

  on<K extends keyof QueueEvents>(event: K, handler: QueueEvents[K]): void {
    this.handlers[event] = handler;
  }

  private emit<K extends keyof QueueEvents>(
    event: K,
    ...args: Parameters<QueueEvents[K]>
  ): void {
    const handler = this.handlers[event];
    if (handler) {
      (handler as (...args: unknown[]) => void)(...args);
    }
  }

  async add(
    name: string,
    data: TData,
    options: JobOptions = {}
  ): Promise<Job<TData>> {
    const id = `${this.name}:${name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const job: Job<TData> = {
      id,
      name,
      data,
      status: options.delay ? "delayed" : "waiting",
      progress: 0,
      attempts: 0,
      maxAttempts: options.attempts ?? 3,
      delay: options.delay ?? 0,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    this.emit("jobAdded", id);

    if (!options.delay) {
      this.processNext();
    } else {
      setTimeout(() => {
        const j = this.jobs.get(id);
        if (j && j.status === "delayed") {
          j.status = "waiting";
          this.processNext();
        }
      }, options.delay);
    }

    return job;
  }

  process(name: string, processor: JobProcessor<TData>): void {
    this.processors.set(name, processor);
    this.processNext();
  }

  private async processNext(): void {
    if (this.isPaused || this.processing.size >= this.concurrency) return;

    const waiting = Array.from(this.jobs.values())
      .filter((j) => j.status === "waiting")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    for (const job of waiting) {
      if (this.processing.size >= this.concurrency) break;

      const processor = this.processors.get(job.name);
      if (!processor) continue;

      this.processing.add(job.id);
      job.status = "active";
      job.startedAt = new Date().toISOString();
      job.attempts++;

      try {
        const result = await processor(job);
        job.status = "completed";
        job.result = result;
        job.completedAt = new Date().toISOString();
        this.emit("jobCompleted", job.id, result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (job.attempts < job.maxAttempts) {
          job.status = "waiting";
          job.error = errorMsg;
          const backoffDelay = 1000 * Math.pow(2, job.attempts - 1);
          setTimeout(() => this.processNext(), backoffDelay);
        } else {
          job.status = "failed";
          job.error = errorMsg;
          job.completedAt = new Date().toISOString();
          this.emit("jobFailed", job.id, errorMsg);
        }
      } finally {
        this.processing.delete(job.id);
      }
    }

    this.processNext();
  }

  getJob(id: string): Job<TData> | undefined {
    return this.jobs.get(id);
  }

  getJobs(status?: JobStatus): Job<TData>[] {
    const jobs = Array.from(this.jobs.values());
    if (status) return jobs.filter((j) => j.status === status);
    return jobs;
  }

  async removeJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.processNext();
  }

  async drain(): Promise<void> {
    this.pause();
    while (this.processing.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.resume();
  }

  clean(): number {
    const completed = this.getJobs("completed");
    const failed = this.getJobs("failed");
    const count = completed.length + failed.length;
    completed.forEach((j) => this.jobs.delete(j.id));
    failed.forEach((j) => this.jobs.delete(j.id));
    return count;
  }

  getStats(): {
    total: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  } {
    return {
      total: this.jobs.size,
      waiting: this.getJobs("waiting").length,
      active: this.getJobs("active").length,
      completed: this.getJobs("completed").length,
      failed: this.getJobs("failed").length,
      delayed: this.getJobs("delayed").length,
      paused: this.isPaused,
    };
  }
}

const queues = new Map<string, Queue>();

export function getQueue<T = unknown>(
  name: string,
  options?: { concurrency?: number }
): Queue<T> {
  if (!queues.has(name)) {
    queues.set(name, new Queue<T>(name, options));
  }
  return queues.get(name) as Queue<T>;
}

export function removeQueue(name: string): boolean {
  return queues.delete(name);
}

export const documentQueue = getQueue("documents");
export const aiQueue = getQueue("ai", { concurrency: 3 });
export const emailQueue = getQueue("emails", { concurrency: 5 });
export const exportQueue = getQueue("exports", { concurrency: 2 });
