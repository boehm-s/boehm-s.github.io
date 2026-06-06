interface ProfilePictureProps {
  src: string;
  alt: string;
}

const resetVantaChaos = (event: React.SyntheticEvent) => {
  event.stopPropagation();
  window.dispatchEvent(new CustomEvent("vanta:profile-picture-interaction"));
};

export const ProfilePicture = ({ src, alt }: ProfilePictureProps) => {
  return (
    <div className="flex-shrink-0">
      <button
        type="button"
        className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-border grayscale"
        onPointerDown={resetVantaChaos}
        onClick={resetVantaChaos}
        onTouchStart={resetVantaChaos}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover scale-120"
        />
      </button>
    </div>
  );
};
