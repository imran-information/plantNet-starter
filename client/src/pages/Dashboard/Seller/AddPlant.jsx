import { Helmet } from 'react-helmet-async'
import AddPlantForm from '../../../components/Form/AddPlantForm'
import useAuth from '../../../hooks/useAuth';
import { uploadImage } from '../../../api/utils';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddPlant = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure()
  const [postLoading, setPostLoading] = useState(false)
  const [image, setImage] = useState({})
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate()

  // submit a plant 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPostLoading(true)
    const form = e.target;
    const name = form.name.value;
    const category = form.category.value;
    const description = form.description.value;
    const price = parseFloat(form.price.value);
    const quantity = parseInt(form.quantity.value);
    const image = form.image.files[0];
    const imageUrl = await uploadImage(image)
    // seller info 
    const seller = {
      name: user.displayName,
      email: user.email,
      image: user.photoURL
    }
    // plantData object
    const plantData = {
      name,
      category,
      description,
      price,
      quantity,
      image: imageUrl,
      seller
    }

    // save a plant data db 
    try {
      await axiosSecure.post('/plants', plantData)
      toast.success('Plant added successfully')
      navigate('/dashboard/my-inventory')
    } catch (error) {
      console.log(error)
      setPostLoading(false)
    } finally {
      form.reset()
      setPostLoading(false)
      setImage({})
      setPreview(null)
    }

  }




  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm handleSubmit={handleSubmit} postLoading={postLoading} setPostLoading={setPostLoading} image={image} setImage={setImage} setPreview={setPreview} preview={preview} />
    </div>
  )
}

export default AddPlant
