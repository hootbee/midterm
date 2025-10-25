import React, { useState, useEffect,useCallback } from 'react';

const commentSectionStyle = {
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #eee',
};

const commentFormStyle = {
  display: 'flex',
  marginTop: '15px',
};

const commentInputStyle = {
  flex: 1,
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
};

const commentButtonStyle = {
  marginLeft: '10px',
  padding: '10px 15px',
  borderRadius: '5px',
  border: 'none',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
};

const commentListStyle = {
  listStyle: 'none',
  padding: 0,
  marginTop: '20px',
};

const commentItemStyle = {
  padding: '10px',
  borderBottom: '1px solid #f0f0f0',
};

const commentAuthorStyle = {
  fontWeight: 'bold',
  marginRight: '10px',
};

const commentDateStyle = {
  color: '#888',
  fontSize: '0.9em',
};

function CommentSection({ itemId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Stores the _id of the comment being replied to
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/${itemId}/comments`);
      if (!res.ok) {
        throw new Error('댓글을 불러오는 데 실패했습니다.');
      }
      const data = await res.json();
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentUser(decodeToken(token));
    }
    if (itemId) {
      fetchComments();
    }
  }, [itemId, fetchComments]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const body = { content: newComment };
    if (replyingTo) {
      body.parentId = replyingTo;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auctions/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setNewComment('');
        setReplyingTo(null); // Reset replyingTo after successful submission
        fetchComments(); // Refresh comments after posting
      } else {
        const data = await res.json();
        throw new Error(data.message || '댓글 작성에 실패했습니다.');
      }
    } catch (err) {
      alert(`댓글 작성 오류: ${err.message}`);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchComments(); // Refresh comments after deleting
      } else {
        const data = await res.json();
        throw new Error(data.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(`댓글 삭제 오류: ${err.message}`);
    }
  };

  const renderComment = (comment, depth) => {
    const canDelete = currentUser && (currentUser.admin || currentUser.uuid === comment.commenterUuid);

    return (
      <li key={comment._id} style={commentItemStyle}>
        <div>
          <span style={commentAuthorStyle}>{comment.nickname}</span>
          <span style={commentDateStyle}>{new Date(comment.createdAt).toLocaleString()}</span>
          {depth < 1 && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
              style={{ ...commentButtonStyle, marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em' }}
            >
              {replyingTo === comment._id ? '취소' : '답글'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteComment(comment._id)}
              style={{ ...commentButtonStyle, marginLeft: '10px', padding: '5px 10px', fontSize: '0.8em', backgroundColor: '#dc3545' }}
            >
              삭제
            </button>
          )}
        </div>
        <p>{comment.content}</p>
        {replyingTo === comment._id && (
          <form onSubmit={handleCommentSubmit} style={{ ...commentFormStyle, marginLeft: '20px' }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="답글을 입력하세요..."
              style={commentInputStyle}
            />
            <button type="submit" style={commentButtonStyle}>등록</button>
          </form>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <ul style={{ ...commentListStyle, marginLeft: '20px' }}>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  if (loading) return <div>댓글 로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div style={commentSectionStyle}>
      <h4>댓글</h4>
      <form onSubmit={handleCommentSubmit} style={commentFormStyle}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          style={commentInputStyle}
        />
        <button type="submit" style={commentButtonStyle}>등록</button>
      </form>
      <ul style={commentListStyle}>
        {comments.map((comment) => renderComment(comment, 0))}
      </ul>
    </div>
  );
}

export default CommentSection;