import { z } from 'zod'
import db, { _UserModel } from '@play-money/database'
import { checkUsername } from './checkUsername'
import { getUserById } from './getUserById'
import { santizeUser } from './sanitizeUser'

export const UpdateSchema = _UserModel.pick({ username: true, bio: true, avatarUrl: true }).partial()

export async function updateUserById({ id, ...data }: { id: string } & z.infer<typeof UpdateSchema>) {
  // TODO: @casesandberg Figure out a cleaner way to strip undefined/nulls
  const { username, bio, avatarUrl } = UpdateSchema.transform((data) => {
    return Object.fromEntries(Object.entries(data).filter(([_, value]) => value != null))
  }).parse(data)

  const user = await getUserById({ id })

  const updatedData: z.infer<typeof UpdateSchema> = {}

  if (username && user.username !== username) {
    const { available, message } = await checkUsername({ username })
    if (!available) {
      throw new Error(message)
    }

    updatedData.username = username
  }
  if (bio) {
    updatedData.bio = bio
  }
  if (avatarUrl) {
    updatedData.avatarUrl = avatarUrl
  }

  const updatedUser = await db.user.update({
    where: { id },
    data: updatedData,
  })

  return santizeUser(updatedUser)
}
