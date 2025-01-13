import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import useRole from '../hooks/useRole';

const SellerRoute = ({ children }) => {
    const [role, isLoading] = useRole()
    if (isLoading) return <LoadingSpinner />

    if (role === 'seller') return children
    return <Navigate to='/dashboard' replace='true' />
};
SellerRoute.propTypes = {
    children: PropTypes.node.isRequired,
};


export default SellerRoute;