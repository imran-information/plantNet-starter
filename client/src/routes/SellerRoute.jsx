import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import useRole from '../hooks/useRole';

const SellerRoute = ({ children }) => {
    const [role, isLoading] = useRole()
    const location = useLocation()

    if (isLoading) return <LoadingSpinner />
    if (role === 'seller') return children
    return <Navigate to='/login' state={{ from: location }} replace='true' />
};
SellerRoute.propTypes = {
    children: PropTypes.node.isRequired,
};


export default SellerRoute;