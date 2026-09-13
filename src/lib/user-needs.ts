import { HandHeart } from "lucide-react";
import { ministries, type Ministry } from "@/data/ministries";
import type { UserNeedDTO } from "@/lib/needs.functions";

const positions = [
  "left-[20%] top-[28%]",
  "right-[26%] top-[30%]",
  "left-[62%] bottom-[30%]",
  "left-[38%] bottom-[22%]",
  "right-[12%] bottom-[36%]",
];

/** Turns a posted need into the shape the map and list components render. */
export function toNeed(dto: UserNeedDTO, index: number): Ministry {
  const photo = dto.photoUrl ?? undefined;
  const picked = dto.category ? ministries.find((m) => m.id === dto.category) : undefined;
  return {
    id: `need-${dto.id}`,
    label: dto.shortTitle,
    icon: picked?.icon ?? HandHeart,
    // Colour needs by the ministry category they match, so the map isn't all grey.
    tone: picked?.tone ?? "need",
    description: dto.description,
    neighborhood: dto.city || dto.zip,
    city: dto.city,
    zip: dto.zip,
    distanceMi: 0.5,
    ...(dto.lat != null && dto.lng != null ? { lat: dto.lat, lng: dto.lng } : {}),
    ...(photo ? { avatarUrl: photo } : {}),
    ...(dto.gallery.length > 0 ? { gallery: dto.gallery } : {}),
    custom: true,
    isNeed: true,
    fullTitle: dto.title,
    postType: "need",
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
