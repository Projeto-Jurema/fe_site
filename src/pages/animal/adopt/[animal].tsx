import { useCallback, useEffect, useState } from 'react'
import { GetStaticPropsContext } from 'next'
import { toast } from 'react-toastify'
import * as S from 'src/styles/animal'

import { Input } from 'src/components/input'
import { Button } from 'src/components/button'
import { Template } from 'src/components/template'
import { CheckBox } from 'src/components/checkbox'
import { getAnimals, sendAdoption } from 'src/services/api'
import { Animal } from 'src/pages/animals'

interface AnimalInterface {
  animal: Animal
}

const Adopt: React.FC<AnimalInterface> = ({ animal }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isValidName, setIsValidName] = useState(true)
  const [isValidPhone, setIsValidPhone] = useState(true)
  const [checked, setChecked] = useState(false)
  const [errorCheckbox, setErrorCheckbox] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('userData')

    if (userData) {
      const user = JSON.parse(userData)

      setName(user.name)
      setPhone(user.phone)
    }
  }, [])

  const validateName = useCallback(() => {
    const [firstName, lastName = ''] = name?.split(' ') || []

    if (firstName?.length < 4 || lastName?.length < 4) {
      setIsValidName(!name)

      return !name
    }

    return true
  }, [name])

  const validatePhone = useCallback(() => {
    if (phone.length < 4) {
      setIsValidPhone(!phone)

      return !phone
    }

    setIsValidName(true)

    return true
  }, [phone])

  useEffect(() => {
    validateName()
    validatePhone()
  }, [name, phone, validatePhone, validateName])

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true)

      if (!isValidName || !isValidPhone) return

      if (!name || !checked || !phone) {
        if (!checked) setErrorCheckbox(true)

        if (!name) setIsValidName(false)

        if (!phone) setIsValidPhone(false)

        return
      }

      await sendAdoption({
        name,
        phone,
        animalLink: `https://projetojurema.org/animal/${animal?.id}`,
      })

      localStorage.setItem('userData', JSON.stringify({ name, phone }))

      localStorage.setItem(animal?.id.toString(), 'alreadyAdopted')

      window.location.href = `/animal/adopt/success/${animal?.id}`
    } catch (error) {
      const message = 'Parece que algo deu errado, tente novamente mais tarde'

      return toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [isValidName, isValidPhone, name, phone, animal, checked])

  const handleCheck = useCallback((e: boolean) => {
    setChecked(e)
  }, [])

  const handleNext = () => {
    const activeId = document.activeElement?.id || ''

    const inputs = {
      'name-input': 'phone-input',
    } as { [key: string]: string }

    const validators = {
      'name-input': validateName,
      'phone-input': validateName,
    } as { [key: string]: Function }

    const setters = {
      'name-input': setIsValidName,
      'phone-input': setIsValidPhone,
    } as { [key: string]: Function }

    const isValid = validators[activeId]?.()

    if (!isValid) return setters[activeId]?.(isValid)

    if (!inputs[activeId]) return handleSubmit()

    const input = document.getElementById(inputs[activeId])

    if (input) {
      input.focus()
    }
  }

  return (
    <Template
      paths={[
        { path: '/animals', label: 'Adote um amigo' },
        { path: `/animal/${animal?.id}`, label: animal?.name },
        { path: '', label: 'Quero adotar' },
      ]}
      title={`Adotar ${animal?.name}`}
    >
      <S.Description style={{ maxWidth: 603 }}>
        Para adotar o(a) {animal?.name}, preencha os campos abaixo e logo
        entraremos em contato com voc?? para prosseguir com o processo de ado????o
      </S.Description>
      <Input
        id="name-input"
        error={!isValidName && 'Nome ?? obrigat??rio'}
        mask=""
        placeholder="Jo??o Silva"
        onEnter={handleNext}
        value={name}
        setValue={setName}
        label="Qual seu nome?"
      />
      <Input
        id="phone-input"
        mask="(99) 99999-9999"
        placeholder="(00) 00000-0000"
        onEnter={handleNext}
        value={phone}
        setValue={setPhone}
        label="Qual seu n??mero de telefone?"
      />
      <CheckBox
        onChange={handleCheck}
        checked={checked}
        error={
          errorCheckbox &&
          'Voc?? precisa aceitar receber mensagens pelo WhatsApp'
        }
      />
      <Button
        mobileWidth="175px"
        onClick={handleSubmit}
        width="222px"
        isLoading={isLoading}
        buttonText="Confirmar"
      />
    </Template>
  )
}

export default Adopt

export async function getStaticPaths() {
  const { data: animalsResponse } = await getAnimals()

  const paths = animalsResponse.map((animal: Animal) => ({
    params: { animal: animal.id.toString() },
  }))

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const animalId = params?.animal

  const { data: animalsResponse } = await getAnimals()

  const animal = animalsResponse?.find?.(
    (animal: Animal) => animal.id.toString() === animalId
  )

  return {
    props: {
      animal,
    },
    revalidate: 1000,
  }
}
