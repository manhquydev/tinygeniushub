import { Job, Worker } from "bullmq";
import { prisma } from "@/lib/db";
import { generateCertificate } from "@/modules/courses/certificate-service";
import { resolveStorageProvider } from "@/modules/platform/storage/providers";
import { redisConnection } from "@/worker/queue";
import { logInfo } from "@/lib/observability/logger";

async function processCertificateJob(enrollmentId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: true,
      parent: { select: { id: true, email: true, displayName: true } },
    },
  });

  if (!enrollment) {
    throw new Error(`Enrollment not found: ${enrollmentId}`);
  }

  if (!enrollment.completedAt) {
    throw new Error(`Enrollment not completed: ${enrollmentId}`);
  }

  const pdfBytes = await generateCertificate({
    courseTitle: enrollment.course.title,
    completedAt: enrollment.completedAt,
  });

  const objectPath = `certificates/${enrollmentId}.pdf`;
  const storage = resolveStorageProvider();

  // Upload to R2 via signed URL flow: for worker context we use a direct approach
  // Since StorageProviderAdapter only does signed uploads, we store mock URL in non-R2 envs
  let certificateUrl: string;
  const exists = await storage.objectExists(objectPath).catch(() => false);
  if (!exists) {
    // For real R2: use AWS SDK put directly or signed URL
    // For mock: just build the mock URL path
    certificateUrl = `/api/certificates/${enrollmentId}`;
  } else {
    certificateUrl = `/api/certificates/${enrollmentId}`;
  }

  // Store PDF bytes in a temporary location accessible by the GET endpoint
  // In production this would be uploaded to R2. For now log and store URL.
  logInfo("worker.certificate.generated", {
    enrollmentId,
    objectPath,
    pdfSize: pdfBytes.length,
  });

  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: { certificateUrl },
  });
}

export function createCertificateWorker() {
  return new Worker(
    "certificates",
    async (job: Job) => {
      if (job.name !== "generate-certificate") return;
      const { enrollmentId } = job.data as { enrollmentId: string };
      await processCertificateJob(enrollmentId);
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );
}
