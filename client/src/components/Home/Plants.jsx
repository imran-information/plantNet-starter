import Card from './Card'
import Container from '../Shared/Container'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import LoadingSpinner from '../Shared/LoadingSpinner'

const Plants = () => {
  // get all plants data
  const { isLoading, data: plants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      const { data } = await axios.get(`http://localhost:9000/plants`);
      return data
    }
  })
  if (isLoading) return <LoadingSpinner />
  // console.log(plants);

  return (
    <Container>
      {
        plants ?
          <div className='pt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8'>
            {
              plants.map(plant => (
                <Card key={plant._id} plant={plant} />
              ))
            }
          </div>
          :
          <h1 className='text-2xl text-center'>No Plants Found </h1>
      }
    </Container>
  )
}

export default Plants
