// import React, { useState } from 'react';
// import axios from 'axios';

// const PostForm = () => {
//   const [title, setTitle] = useState('');
//   const [text, setText] = useState('');
//   const [subreddits, setSubreddits] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const accessToken = localStorage.getItem('reddit_access_token');

//     const subredditList = subreddits.split(',').map(s => s.trim());

//     for (const subreddit of subredditList) {
//       try {
//         await axios.post(`https://oauth.reddit.com/api/submit`, null, {
//           params: {
//             sr: subreddit,
//             title: title,
//             text: text,
//             kind: 'self',
//           },
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         });
//         alert(`Post submitted to ${subreddit}`);
//       } catch (error) {
//         console.error(`Error posting to ${subreddit}:`, error);
//       }
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <div>
//         <label>Title:</label>
//         <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
//       </div>
//       <div>
//         <label>Text:</label>
//         <textarea value={text} onChange={(e) => setText(e.target.value)} required />
//       </div>
//       <div>
//         <label>Subreddits (comma separated):</label>
//         <input type="text" value={subreddits} onChange={(e) => setSubreddits(e.target.value)} required />
//       </div>
//       <button type="submit">Submit</button>
//     </form>
//   );
// };

// export default PostForm;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PostForm = () => {
  // Estados del formulario
  const [postType, setPostType] = useState('text');
  const [isNSFW, setIsNSFW] = useState(false);
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [subreddits, setSubreddits] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Obtener nombre de usuario de Reddit
  useEffect(() => {
    const fetchUsername = async () => {
      const accessToken = localStorage.getItem('reddit_access_token');
      try {
        const response = await axios.get('https://oauth.reddit.com/api/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': `${process.env.REACT_APP_USER_AGENT}`
          }
        });
        setUsername(response.data.name);
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };
    
    if (localStorage.getItem('reddit_access_token')) {
      fetchUsername();
    }
  }, []);

  // Manejar selección de imágenes
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('Máximo 5 imágenes permitidas');
      return;
    }
    setSelectedImages(files);
  };

  // Eliminar imagen seleccionada
  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  // Enviar post a Reddit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('reddit_access_token');
    const subredditList = subreddits.split(',').map(s => s.trim());

    try {
      for (const subreddit of subredditList) {
        const formData = new FormData();
        formData.append('sr', subreddit);
        formData.append('title', title);
        formData.append('text', text);
        formData.append('kind', postType === 'image' ? 'image' : 'self');
        formData.append('nsfw', isNSFW);
        formData.append('send_replies', 'true'); // Habilitar notificaciones
        
        // Adjuntar imágenes si es post de imagen
        if (postType === 'image' && selectedImages.length > 0) {
          selectedImages.forEach((image, index) => {
            formData.append(`file_${index}`, image);
          });
        }

        await axios.post('https://oauth.reddit.com/api/submit', formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
            'User-Agent': process.env.REACT_APP_USER_AGENT
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        });
      }
      
      // Resetear formulario después de enviar
      setTitle('');
      setText('');
      setSubreddits('');
      setSelectedImages([]);
      setUploadProgress(0);
      alert('¡Post publicado exitosamente!');
      
    } catch (error) {
      console.error('Error al publicar:', error);
      alert('Error al publicar el post');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar izquierdo */}
      <div className="w-64 bg-black text-white border-r p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-4">The Publisher 💀</h1>
          <nav className="space-y-2">
            {['Scheduled', 'History', 'Drafts', 'Templates'].map((item) => (
              <button key={item} className="flex items-center w-full p-2 hover:bg-gray-100 rounded">
                {item}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 p-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Selector de tipo de post */}
          <div className="flex gap-2 mb-6">
            {['Image', 'Text', 'Link'].map((type) => (
              <button
                key={type}
                onClick={() => setPostType(type.toLowerCase())}
                className={`px-4 py-2 rounded ${
                  postType === type.toLowerCase() 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Selector de imágenes */}
          {postType === 'image' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Subir imágenes (máx. 5)
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full p-2 border rounded mt-2"
                />
              </label>
              
              {/* Previsualización de imágenes */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                      className="h-32 w-full object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos del formulario */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Publicar como</label>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
              <span className="text-sm">u/{username || 'cargando...'}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Escribe un título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {title.length}/300
            </div>
          </div>

          {postType === 'text' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Contenido</label>
              <textarea
                className="w-full p-2 border rounded h-32"
                placeholder="Escribe tu contenido aquí"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Subreddits</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Ej: programming,technology"
              value={subreddits}
              onChange={(e) => setSubreddits(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">Separa con comas para múltiples subreddits</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isNSFW}
                onChange={(e) => setIsNSFW(e.target.checked)}
                className="form-checkbox h-4 w-4"
              />
              <span className="text-sm">NSFW</span>
            </label>
          </div>

          {/* Barra de progreso */}
          {uploadProgress > 0 && (
            <div className="mb-4 bg-gray-200 rounded">
              <div
                className="bg-blue-500 text-xs h-4 rounded transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-between">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => {
                setTitle('');
                setText('');
                setSelectedImages([]);
              }}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSubmit}
            >
              {postType === 'image' ? 'Subir imágenes' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostForm;