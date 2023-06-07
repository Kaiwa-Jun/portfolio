import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { getPhotoById, postComment } from "../../utils/api";
import { getComments } from "../../utils/api";
import { Photo } from "../../types/photo";
import { Comment } from "../../types/comment";
import HeroSection from "../../components/organisms/HeroSection";
import Image from "next/image";
import { useAuth } from "../../contexts/UserContext";

interface CommentPageProps {
  initialPhoto: Photo | null;
}

const CommentPage: React.FC<CommentPageProps> = ({ initialPhoto }) => {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(initialPhoto);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const fixedHeight = 300; // 画像の高さを固定
  const router = useRouter();
  const { photoId } = router.query;

  const aspectRatio =
    photo && photo.height && photo.width ? photo.height / photo.width : 1;

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      setImageWidth(screenWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [photo, fixedHeight]);

  useEffect(() => {
    if (!initialPhoto && photoId) {
      getPhotoById(photoId).then((photo) => setPhoto(photo));
    }
  }, [photoId, initialPhoto]);

  useEffect(() => {
    if (photo) {
      getComments(photo.id).then((comments) => {
        console.log(comments); // ここでAPIのレスポンスをログ出力
        setComments(comments);
      });
    }
  }, [photo]);

  if (!photo) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="my-7">
        <div className="flex items-center justify-center my-5">
          <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <Image
              src={
                photo.user && photo.user.avatar_url
                  ? photo.user.avatar_url
                  : "/path/to/default/avatar.png"
              }
              alt="User avatar"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div className="py-1 ml-6 text-2xl">
            <p className="text-gray-900">
              {photo.user ? photo.user.display_name : "Loading..."}
            </p>
          </div>
        </div>
        <div className="flex flex-row-reverse justify-center mx-auto max-w-screen-lg">
          <div className="p-4 w-1/4">
            <p className="text-gray-900">カメラ: {photo.camera_model}</p>
            <p className="text-gray-900">ISO: {photo.iso}</p>
            <p className="text-gray-900">F値: {photo.f_value}</p>
            <p className="text-gray-900">
              シャッタースピード: {photo.shutter_speed}
            </p>
            <p className="text-gray-900">
              撮影日:{" "}
              {new Date(photo.taken_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="w-1/4">
            <div
              className="relative"
              style={{ width: `${100 * aspectRatio}%`, height: fixedHeight }}
            >
              <Image
                src={photo.file_url}
                alt="Uploaded photo"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <p className="            text-gray-500">
              {new Date(photo.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ここにコメント内容を表示 */}
      {comments.map((comment, index) => (
        <div key={index}>
          <p>
            {comment.user ? comment.user.display_name : "Anonymous"}:{" "}
            {comment.content}
          </p>
        </div>
      ))}

      {/* コメント入力フォーム */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (user && user.idToken) {
            // 追加
            postComment(comment, photo.id, user.idToken).then((newComment) => {
              // 修正
              // コメントが投稿された後の処理をここに追加します。
              // 例えば、コメントのテキストをクリアする、新しいコメントを表示するなど。
              setComment("");
              setComments([...comments, newComment]);
            });
          }
        }}
      >
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="コメントを入力..."
        />
        <button type="submit">コメントを投稿</button>
      </form>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const photoId = context.params?.photoId;

  if (!photoId || typeof photoId !== "string") {
    return { notFound: true };
  }

  const photo = await getPhotoById(photoId);

  return {
    props: {
      initialPhoto: photo,
    },
  };
};

export default CommentPage;
