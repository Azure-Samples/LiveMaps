import './index.scss';

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ContextualMenu, IContextualMenuItem, Persona } from '@fluentui/react';

import { selectUserName, logout } from '../../reducers/user';

interface PersonaButtonProps {
  userName?: string;
  onClick?: () => void;
}

const PersonaButton: React.FC<PersonaButtonProps> = ({
  userName = '',
  onClick,
}) => {
  return (
    <button
      className="persona-button"
      onClick={userName ? onClick : undefined}
      contentEditable={false}
    >
      <Persona
        text={userName}
        hidePersonaDetails
      />
    </button>
  );
};

const UserControl: React.FC = () => {
  const userName = useSelector(selectUserName)
  const [isMenuVisible, setMenuVisible] = React.useState(false);
  const toggleIsCalloutVisibility = () => { setMenuVisible(!isMenuVisible) };
  const dispatch = useDispatch();
  const history = useHistory();
  const handleSignout = useCallback(() => { dispatch(logout(history)) }, [dispatch, history]);

  const menuItems: IContextualMenuItem[] = [
    {
      key: 'signout',
      text: 'Sign Out',
      onClick: handleSignout,
      iconProps: {
        iconName: 'SignOut',
      }
    }
  ];

  return (
    <React.Fragment>
      <PersonaButton
        userName={userName}
        onClick={toggleIsCalloutVisibility}
      />

      <ContextualMenu
        isBeakVisible
        target=".persona-button"
        items={menuItems}
        hidden={!isMenuVisible}
        onDismiss={toggleIsCalloutVisibility}
      />
    </React.Fragment>
  );
};

export default UserControl;
