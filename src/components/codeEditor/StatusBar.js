const StatusBar = ({ lineCount, maxLines, isLimitReached }) => {
  return (
    <div
      className={`editor-status-bar ${isLimitReached ? "limit-reached" : ""}`}
    >
      {isLimitReached && <span>{`(Virtalization isn't enabled)`} &nbsp;</span>}
      <span>
        Lines: {lineCount} / {maxLines}
      </span>
    </div>
  );
};

export default StatusBar;
