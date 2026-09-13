import { HeartHandshake } from "lucide-react";
import { ministries, type Ministry, type Tone } from "@/data/ministries";
import type { UserMinistryDTO } from "@/lib/ministries.functions";

const presetById = new Map(ministries.map((m) => [m.id, m]));

const positions = [
  "left-[30%] top-[46%]",
  "right-[44%] top-[62%]",
  "left-[54%] bottom-[46%]",
  "right-[20%] top-[52%]",
  "left-[8%] top-[52%]",
];

/** Turns a saved, user-created ministry into the shape the map and list render. */
export function toMinistry(dto: UserMinistryDTO, index: number): Ministry {
  const photo = dto.photoUrl ?? undefined;
  const preset = dto.iconId ? presetById.get(dto.iconId) : undefined;
  const icon = preset?.icon ?? HeartHandshake;
  const tone: Tone = preset?.tone ?? "purple";
  return {
    id: `user-${dto.id}`,
    label: dto.shortTitle,
    icon,
    tone,
    description: dto.description,
    neighborhood: dto.city,
    city: dto.city,
    zip: dto.zip,
    distanceMi: 0.5,
    // With a pre-made ministry icon, the drawn icon is the pin; the photo stays for the poster card.
    ...(photo && !preset ? { avatarUrl: photo } : {}),
    ...(dto.gallery.length > 0 ? { gallery: dto.gallery } : {}),
    custom: true,
    fullTitle: dto.title,
    postType: "ministry",
    postId: dto.id,
    ownerId: dto.ownerId,
    poster: {
      name: dto.posterName,
      ...(dto.posterPhotoUrl ?? photo ? { photo: (dto.posterPhotoUrl ?? photo) as string } : {}),
      bio: dto.posterBio || dto.title,
    },
    likes: dto.likes,
    favorites: 0,
    comments: dto.comments,
    position: positions[index % positions.length]!,
  };
}
