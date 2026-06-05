import { prisma } from './prisma'

interface LogOptions {
  userId:        string
  bhojanshalaId?: string | null
  action:        string
  description?:  string
}

export async function log(opts: LogOptions): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId:        opts.userId,
        bhojanshalaId: opts.bhojanshalaId ?? null,
        action:        opts.action,
        description:   opts.description ?? null,
      },
    })
  } catch (err) {
    // Logging must never break the main request
    console.error('[ActivityLog] Failed to write log:', err)
  }
}
