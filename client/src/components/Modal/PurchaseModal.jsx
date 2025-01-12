/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { Fragment, useState } from 'react'
import useAuth from '../../hooks/useAuth';
import Button from '../Shared/Button/Button';
import toast from 'react-hot-toast';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useNavigate } from 'react-router-dom';

const PurchaseModal = ({ refetch, closeModal, isOpen, plant }) => {
  const { user } = useAuth()
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();
  const { name, category, price, seller, quantity, _id } = plant;
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderPrice, setOrderPrice] = useState(price);
  const [shippingAddress, setShippingAddress] = useState('');

  const handleQuantity = (totalQuantity) => {
    // Quantity Validation
    if (totalQuantity > quantity) {
      setOrderQuantity(quantity)
      return toast.error('Quantity exceeds available stock.!')
    }
    if (totalQuantity <= 0) {
      setOrderQuantity(1);
      return toast.error('Quantity cannot be less than 1')
    }
    setOrderQuantity(totalQuantity)
    // Total Price Calculation
    setOrderPrice(isNaN(totalQuantity) ? 0 : totalQuantity * price);

  };

  const handleOrderSubmit = () => {
    const orderInfo = {
      plantId: _id,
      plantPerPrice: price,
      quantity: orderQuantity,
      price: orderPrice,
      shippingAddress: shippingAddress,
      seller: seller,
      customer: {
        name: user?.displayName,
        email: user.email,
        image: user?.photoURL
      },
      status: 'pending',
    }
    // console.log(orderInfo);
    // Send order to the backend
    try {
      axiosSecure.post('/orders', orderInfo)
      toast.success('Order placed successfully!')
      // plant quantity update after order placed 
      axiosSecure.patch(`/plants/quantity/${_id}`, { updatedQuantity: orderQuantity })
      refetch()
      navigate('/dashboard/my-orders')
    } catch (error) {
      console.log(error);
      toast.error('Failed to place order. Please try again later.')
    } finally {
      closeModal();
      refetch()
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </TransitionChild>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <DialogPanel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <DialogTitle
                  as='h3'
                  className='text-lg font-medium text-center leading-6 text-gray-900'
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Plant: {name}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Category: {category}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Customer: {user?.displayName}</p>
                </div>

                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Price: ${price}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Available Quantity: {quantity}</p>
                </div>
                {/* Quantity */}
                <div className='space-y-1 text-sm'>
                  <label htmlFor='quantity' className='block text-gray-600'>
                    Quantity
                  </label>
                  <input
                    className='w-full px-4 py-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white'
                    value={orderQuantity}
                    onChange={(e) => handleQuantity(parseInt(e.target.value))}
                    name='quantity'
                    id='quantity'
                    type='number'
                    placeholder='Quantity'
                    required
                  />
                </div>

                {/* Price */}
                <div className='space-y-1 text-sm'>
                  <label htmlFor='address' className='block text-gray-600 '>
                    Address
                  </label>
                  <input
                    className='w-full px-4 py-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white'
                    name='address'
                    onChange={(e) => setShippingAddress(e.target.value)}
                    id='address'
                    type='text'
                    placeholder='Shipping Address'
                    required
                  />
                </div>

                <div className="mt-3">
                  <Button onClick={handleOrderSubmit} label={`Pay ${orderPrice}$`}></Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default PurchaseModal
